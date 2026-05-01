BEGIN;

DROP TABLE IF EXISTS APPOINTMENT_AUDIT_LOG CASCADE;
DROP TABLE IF EXISTS PROVIDER_AVAILABILITY CASCADE;
DROP TABLE IF EXISTS APPOINTMENT CASCADE;
DROP TABLE IF EXISTS APPOINTMENT_STATUS CASCADE;
DROP TABLE IF EXISTS PROVIDER CASCADE;
DROP TABLE IF EXISTS DEPARTMENT CASCADE;
DROP TABLE IF EXISTS PATIENT CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;

CREATE TABLE "USER" (
  user_id INT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('patient', 'provider', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PATIENT (
  patient_id INT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10)
    CHECK (gender IN ('male', 'female', 'other')),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  FOREIGN KEY (user_id)
    REFERENCES "USER"(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE DEPARTMENT (
  department_id INT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(200),
  phone VARCHAR(20)
);

CREATE TABLE PROVIDER (
  provider_id INT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department_id INT NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) NOT NULL UNIQUE,
  FOREIGN KEY (user_id)
    REFERENCES "USER"(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (department_id)
    REFERENCES DEPARTMENT(department_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE APPOINTMENT_STATUS (
  status_id INT PRIMARY KEY,
  status_name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE APPOINTMENT (
  appointment_id INT PRIMARY KEY,
  patient_id INT NOT NULL,
  provider_id INT NOT NULL,
  department_id INT NOT NULL,
  status_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time),
  FOREIGN KEY (patient_id)
    REFERENCES PATIENT(patient_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (provider_id)
    REFERENCES PROVIDER(provider_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (department_id)
    REFERENCES DEPARTMENT(department_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (status_id)
    REFERENCES APPOINTMENT_STATUS(status_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE PROVIDER_AVAILABILITY (
  availability_id INT PRIMARY KEY,
  provider_id INT NOT NULL,
  day_of_week VARCHAR(10) NOT NULL
    CHECK (day_of_week IN (
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    )),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (end_time > start_time),
  FOREIGN KEY (provider_id)
    REFERENCES PROVIDER(provider_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE APPOINTMENT_AUDIT_LOG (
  log_id INT PRIMARY KEY,
  appointment_id INT NOT NULL,
  changed_by INT NOT NULL,
  old_status_id INT,
  new_status_id INT,
  change_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  change_reason VARCHAR(255),
  FOREIGN KEY (appointment_id)
    REFERENCES APPOINTMENT(appointment_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (changed_by)
    REFERENCES "USER"(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (old_status_id)
    REFERENCES APPOINTMENT_STATUS(status_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (new_status_id)
    REFERENCES APPOINTMENT_STATUS(status_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE OR REPLACE FUNCTION enforce_appointment_lead_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  appointment_starts TIMESTAMP;
BEGIN
  IF current_setting('clinicflow.seed_mode', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF current_setting('clinicflow.actor_role', true) = 'admin' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.appointment_date IS DISTINCT FROM OLD.appointment_date
     OR NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    appointment_starts := NEW.appointment_date + NEW.start_time;

    IF appointment_starts < CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'Appointments must be scheduled at least 24 hours in advance.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER appointment_lead_time_guard
BEFORE INSERT OR UPDATE ON APPOINTMENT
FOR EACH ROW
EXECUTE FUNCTION enforce_appointment_lead_time();

CREATE OR REPLACE FUNCTION sync_overdue_scheduled_appointments(actor_user_id INT DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  scheduled_status_id INT;
  completed_status_id INT;
  acting_user_id INT;
  updated_count INT := 0;
BEGIN
  SELECT status_id INTO scheduled_status_id
  FROM APPOINTMENT_STATUS
  WHERE status_name = 'Scheduled'
  LIMIT 1;

  SELECT status_id INTO completed_status_id
  FROM APPOINTMENT_STATUS
  WHERE status_name = 'Completed'
  LIMIT 1;

  IF scheduled_status_id IS NULL OR completed_status_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(
    actor_user_id,
    (SELECT user_id FROM "USER" WHERE role = 'admin' ORDER BY user_id LIMIT 1),
    (SELECT user_id FROM "USER" ORDER BY user_id LIMIT 1)
  )
  INTO acting_user_id;

  IF acting_user_id IS NULL THEN
    RETURN 0;
  END IF;

  WITH due AS (
    SELECT appointment_id, status_id AS old_status_id
    FROM APPOINTMENT
    WHERE status_id = scheduled_status_id
      AND (appointment_date + end_time) <= CURRENT_TIMESTAMP
    FOR UPDATE
  ),
  updated AS (
    UPDATE APPOINTMENT appointment
    SET status_id = completed_status_id
    FROM due
    WHERE appointment.appointment_id = due.appointment_id
    RETURNING appointment.appointment_id, due.old_status_id
  ),
  numbered AS (
    SELECT appointment_id, old_status_id, ROW_NUMBER() OVER (ORDER BY appointment_id) AS row_num
    FROM updated
  ),
  next_log AS (
    SELECT COALESCE(MAX(log_id), 0) AS base_log_id
    FROM APPOINTMENT_AUDIT_LOG
  )
  INSERT INTO APPOINTMENT_AUDIT_LOG (
    log_id,
    appointment_id,
    changed_by,
    old_status_id,
    new_status_id,
    change_timestamp,
    change_reason
  )
  SELECT
    next_log.base_log_id + numbered.row_num,
    numbered.appointment_id,
    acting_user_id,
    numbered.old_status_id,
    completed_status_id,
    CURRENT_TIMESTAMP,
    'Appointment automatically marked completed after the scheduled end time passed.'
  FROM numbered
  CROSS JOIN next_log;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$;

COMMIT;
