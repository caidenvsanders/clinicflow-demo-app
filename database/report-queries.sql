-- 6.1 INSERT: A new user registers an account.
INSERT INTO "USER" (
  user_id, first_name, last_name, email, password_hash, phone, role, created_at
) VALUES (
  1, 'John', 'Doe', 'john.doe@email.com', 'hashed_pw_123', '509-555-0101', 'patient', CURRENT_TIMESTAMP
);

-- 6.2 INSERT: The new user receives a patient profile.
INSERT INTO PATIENT (
  patient_id, user_id, date_of_birth, gender, emergency_contact_name,
  emergency_contact_phone, insurance_provider, insurance_policy_number
) VALUES (
  1, 1, '1990-05-15', 'male', 'Jane Doe', '509-555-0102', 'Blue Cross', 'BC-998877'
);

-- 6.3 INSERT: A patient books a new appointment.
INSERT INTO APPOINTMENT (
  appointment_id, patient_id, provider_id, department_id, status_id,
  appointment_date, start_time, end_time, reason, notes, created_at
) VALUES (
  1, 1, 1, 1, 1, '2026-04-15', '09:00', '09:30', 'Annual checkup', NULL, CURRENT_TIMESTAMP
);

-- 6.4 INSERT: An audit log entry is created when the appointment is booked.
INSERT INTO APPOINTMENT_AUDIT_LOG (
  log_id, appointment_id, changed_by, old_status_id, new_status_id,
  change_timestamp, change_reason
) VALUES (
  1, 1, 1, NULL, 1, CURRENT_TIMESTAMP, 'Appointment created'
);

-- 6.5 UPDATE: A patient reschedules an appointment.
UPDATE APPOINTMENT
SET appointment_date = '2026-04-20',
    start_time = '10:00',
    end_time = '10:30'
WHERE appointment_id = 1;

-- 6.6 UPDATE: A provider marks an appointment as completed.
UPDATE APPOINTMENT
SET status_id = 2
WHERE appointment_id = 1;

-- 6.7 UPDATE: A provider changes Monday availability.
UPDATE PROVIDER_AVAILABILITY
SET start_time = '08:00',
    end_time = '16:00'
WHERE provider_id = 1
  AND day_of_week = 'Monday';

-- 6.8 DELETE: A patient deletes their account entirely.
DELETE FROM "USER"
WHERE user_id = 1;

-- 6.9 DELETE: An administrator removes an old availability slot.
DELETE FROM PROVIDER_AVAILABILITY
WHERE availability_id = 3;

-- 6.10 DELETE: An administrator tries to delete a department that still has providers.
DELETE FROM DEPARTMENT
WHERE department_id = 1;

-- 6.11 SELECT: A patient views upcoming scheduled appointments.
SELECT appointment_id, appointment_date, start_time, end_time, reason
FROM APPOINTMENT
WHERE patient_id = 1
  AND appointment_date >= CURRENT_DATE
  AND status_id = 1
ORDER BY appointment_date, start_time;

-- 6.12 SELECT: An administrator finds patients who have never booked an appointment.
SELECT p.patient_id, u.first_name, u.last_name
FROM PATIENT p
JOIN "USER" u ON p.user_id = u.user_id
LEFT JOIN APPOINTMENT a ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;

-- 7.1 Query 1: View all upcoming appointments with patient and provider names.
SELECT a.appointment_id, a.appointment_date, a.start_time, a.end_time,
       pu.first_name AS patient_first, pu.last_name AS patient_last,
       pru.first_name AS provider_first, pru.last_name AS provider_last
FROM APPOINTMENT a
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
JOIN PROVIDER pr ON a.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id
WHERE a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.start_time;

-- 7.2 Query 2: Find all providers in Cardiology along with weekly availability.
SELECT pru.first_name, pru.last_name, pr.specialty, pa.day_of_week, pa.start_time, pa.end_time
FROM PROVIDER pr
JOIN "USER" pru ON pr.user_id = pru.user_id
JOIN DEPARTMENT d ON pr.department_id = d.department_id
LEFT JOIN PROVIDER_AVAILABILITY pa ON pr.provider_id = pa.provider_id
WHERE d.department_name = 'Cardiology'
ORDER BY pru.last_name, pa.day_of_week;

-- 7.3 Query 3: Get one patient's appointment history with status names and provider names.
SELECT a.appointment_id, a.appointment_date, a.start_time, a.reason, s.status_name,
       pru.first_name AS provider_first, pru.last_name AS provider_last
FROM APPOINTMENT a
JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
JOIN PROVIDER pr ON a.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id
WHERE a.patient_id = 1
ORDER BY a.appointment_date DESC;

-- 7.4 Query 4: Count how many appointments each department has.
SELECT d.department_name, COUNT(a.appointment_id) AS total_appointments
FROM DEPARTMENT d
LEFT JOIN APPOINTMENT a ON d.department_id = a.department_id
GROUP BY d.department_name
ORDER BY total_appointments DESC;

-- 7.5 Query 5: Find all cancelled appointments and identify who cancelled them.
SELECT a.appointment_id, a.appointment_date,
       pu.first_name AS patient_first, pu.last_name AS patient_last,
       cu.first_name AS cancelled_by_first, cu.last_name AS cancelled_by_last,
       al.change_timestamp, al.change_reason
FROM APPOINTMENT a
JOIN APPOINTMENT_AUDIT_LOG al ON a.appointment_id = al.appointment_id
JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
JOIN "USER" cu ON al.changed_by = cu.user_id
WHERE ns.status_name = 'Cancelled';

-- 7.6 Query 6: Detect double-bookings by finding overlapping appointments for the same provider.
SELECT a1.appointment_id AS appt1, a2.appointment_id AS appt2,
       a1.appointment_date, a1.start_time AS start1, a1.end_time AS end1,
       a2.start_time AS start2, a2.end_time AS end2,
       pru.first_name, pru.last_name
FROM APPOINTMENT a1
JOIN APPOINTMENT a2
  ON a1.provider_id = a2.provider_id
 AND a1.appointment_date = a2.appointment_date
 AND a1.appointment_id < a2.appointment_id
 AND a1.start_time < a2.end_time
 AND a2.start_time < a1.end_time
JOIN PROVIDER pr ON a1.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id;

-- 7.7 Query 7: Find providers who currently have zero appointments scheduled.
SELECT pru.first_name, pru.last_name, pr.specialty, d.department_name
FROM PROVIDER pr
JOIN "USER" pru ON pr.user_id = pru.user_id
JOIN DEPARTMENT d ON pr.department_id = d.department_id
LEFT JOIN APPOINTMENT a ON pr.provider_id = a.provider_id
WHERE a.appointment_id IS NULL;

-- 7.8 Query 8: Show the full audit trail for a specific appointment.
SELECT al.log_id, al.change_timestamp,
       os.status_name AS old_status,
       ns.status_name AS new_status,
       u.first_name AS changed_by_first,
       u.last_name AS changed_by_last,
       al.change_reason
FROM APPOINTMENT_AUDIT_LOG al
JOIN "USER" u ON al.changed_by = u.user_id
LEFT JOIN APPOINTMENT_STATUS os ON al.old_status_id = os.status_id
LEFT JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
WHERE al.appointment_id = 1
ORDER BY al.change_timestamp;

-- 7.9 Query 9: Find patients with more than three appointments in the last 30 days.
SELECT pu.first_name, pu.last_name, COUNT(a.appointment_id) AS appt_count
FROM APPOINTMENT a
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY pu.first_name, pu.last_name
HAVING COUNT(a.appointment_id) > 3;

-- 7.10 Query 10: List today's full schedule with department, provider, patient, and status.
SELECT a.appointment_id, a.start_time, a.end_time, a.reason,
       pu.first_name AS patient_first, pu.last_name AS patient_last,
       pru.first_name AS provider_first, pru.last_name AS provider_last,
       d.department_name, s.status_name
FROM APPOINTMENT a
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
JOIN PROVIDER pr ON a.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id
JOIN DEPARTMENT d ON a.department_id = d.department_id
JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.start_time;
