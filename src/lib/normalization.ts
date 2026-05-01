export const functionalDependencies = [
  {
    table: "USER",
    key: "user_id",
    determines:
      "first_name, last_name, email, password_hash, phone, role, created_at"
  },
  {
    table: "PATIENT",
    key: "patient_id",
    determines:
      "user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_policy_number"
  },
  {
    table: "DEPARTMENT",
    key: "department_id",
    determines: "department_name, location, phone"
  },
  {
    table: "PROVIDER",
    key: "provider_id",
    determines: "user_id, department_id, specialty, license_number"
  },
  {
    table: "APPOINTMENT_STATUS",
    key: "status_id",
    determines: "status_name"
  },
  {
    table: "APPOINTMENT",
    key: "appointment_id",
    determines:
      "patient_id, provider_id, department_id, status_id, appointment_date, start_time, end_time, reason, notes, created_at"
  },
  {
    table: "PROVIDER_AVAILABILITY",
    key: "availability_id",
    determines: "provider_id, day_of_week, start_time, end_time"
  },
  {
    table: "APPOINTMENT_AUDIT_LOG",
    key: "log_id",
    determines:
      "appointment_id, changed_by, old_status_id, new_status_id, change_timestamp, change_reason"
  }
];

export const normalForms = [
  {
    label: "1NF",
    result:
      "All attributes are atomic. Repeating groups such as status labels, department facts, availability windows, and audit history are stored in separate tables."
  },
  {
    label: "2NF",
    result:
      "Every final table uses a single-attribute primary key, so no non-key attribute depends on only part of a composite key."
  },
  {
    label: "3NF",
    result:
      "Shared user data, department data, and status labels were separated into their own relations; appointments store foreign keys to those dimensions."
  },
  {
    label: "BCNF",
    result:
      "Every determinant in the final schema is a candidate key, and natural identifiers such as email and license number are UNIQUE."
  },
  {
    label: "4NF",
    result:
      "Provider availability and appointment audit history are independent multi-valued facts stored outside the appointment row."
  },
  {
    label: "5NF",
    result:
      "No remaining join dependency justifies further decomposition; the full business view reconstructs through lossless joins."
  }
];
