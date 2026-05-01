import { QueryDefinition } from "./types";

export const queryCatalog: QueryDefinition[] = [
  {
    id: "crud-6-1",
    number: "6.1",
    title: "INSERT: new user account",
    category: "CRUD",
    scenario: "A new user registers an account.",
    sql: `INSERT INTO "USER" (
  user_id, first_name, last_name, email, password_hash, phone, role, created_at
) VALUES (
  1, 'John', 'Doe', 'john.doe@email.com', 'hashed_pw_123', '509-555-0101', 'patient', CURRENT_TIMESTAMP
);`,
    expectedBehavior:
      "A new USER row is created. If the email already exists, the insert fails because of the UNIQUE constraint.",
    runnable: false
  },
  {
    id: "crud-6-2",
    number: "6.2",
    title: "INSERT: patient profile",
    category: "CRUD",
    scenario: "The new user receives a patient profile.",
    sql: `INSERT INTO PATIENT (
  patient_id, user_id, date_of_birth, gender, emergency_contact_name,
  emergency_contact_phone, insurance_provider, insurance_policy_number
) VALUES (
  1, 1, '1990-05-15', 'male', 'Jane Doe', '509-555-0102', 'Blue Cross', 'BC-998877'
);`,
    expectedBehavior:
      "A PATIENT record is created and linked to user_id 1. UNIQUE(user_id) ensures one patient profile per user.",
    runnable: false
  },
  {
    id: "crud-6-3",
    number: "6.3",
    title: "INSERT: book appointment",
    category: "CRUD",
    scenario: "A patient books a new appointment.",
    sql: `INSERT INTO APPOINTMENT (
  appointment_id, patient_id, provider_id, department_id, status_id,
  appointment_date, start_time, end_time, reason, notes, created_at
) VALUES (
  1, 1, 1, 1, 1, '2026-04-15', '09:00', '09:30', 'Annual checkup', NULL, CURRENT_TIMESTAMP
);`,
    expectedBehavior:
      "The appointment is created only if every referenced patient, provider, department, and status exists.",
    runnable: false
  },
  {
    id: "crud-6-4",
    number: "6.4",
    title: "INSERT: audit entry",
    category: "CRUD",
    scenario: "An audit log entry is created when the appointment is booked.",
    sql: `INSERT INTO APPOINTMENT_AUDIT_LOG (
  log_id, appointment_id, changed_by, old_status_id, new_status_id,
  change_timestamp, change_reason
) VALUES (
  1, 1, 1, NULL, 1, CURRENT_TIMESTAMP, 'Appointment created'
);`,
    expectedBehavior:
      "A status-history record is inserted with old_status_id = NULL because the appointment is being created.",
    runnable: false
  },
  {
    id: "crud-6-5",
    number: "6.5",
    title: "UPDATE: reschedule appointment",
    category: "CRUD",
    scenario: "A patient reschedules an appointment.",
    sql: `UPDATE APPOINTMENT
SET appointment_date = '2026-04-20',
    start_time = '10:00',
    end_time = '10:30'
WHERE appointment_id = 1;`,
    expectedBehavior:
      "The date and times are updated. The CHECK constraint still enforces end_time > start_time.",
    runnable: false
  },
  {
    id: "crud-6-6",
    number: "6.6",
    title: "UPDATE: mark completed",
    category: "CRUD",
    scenario: "A provider marks an appointment as completed.",
    sql: `UPDATE APPOINTMENT
SET status_id = 2
WHERE appointment_id = 1;`,
    expectedBehavior:
      "The status changes from Scheduled to Completed only if status_id 2 exists in APPOINTMENT_STATUS.",
    runnable: false
  },
  {
    id: "crud-6-7",
    number: "6.7",
    title: "UPDATE: provider availability",
    category: "CRUD",
    scenario: "A provider changes Monday availability.",
    sql: `UPDATE PROVIDER_AVAILABILITY
SET start_time = '08:00',
    end_time = '16:00'
WHERE provider_id = 1
  AND day_of_week = 'Monday';`,
    expectedBehavior:
      "The provider availability window is updated while preserving valid time ordering.",
    runnable: false
  },
  {
    id: "crud-6-8",
    number: "6.8",
    title: "DELETE: patient account",
    category: "CRUD",
    scenario: "A patient deletes their account entirely.",
    sql: `DELETE FROM "USER"
WHERE user_id = 1;`,
    expectedBehavior:
      "Cascade rules remove the patient record, appointments, and related audit log entries in a consistent order.",
    runnable: false
  },
  {
    id: "crud-6-9",
    number: "6.9",
    title: "DELETE: old availability slot",
    category: "CRUD",
    scenario: "An administrator removes an old availability slot.",
    sql: `DELETE FROM PROVIDER_AVAILABILITY
WHERE availability_id = 3;`,
    expectedBehavior:
      "The selected availability record is removed without affecting unrelated tables.",
    runnable: false
  },
  {
    id: "crud-6-10",
    number: "6.10",
    title: "DELETE: restricted department",
    category: "CRUD",
    scenario: "An administrator tries to delete a department that still has providers.",
    sql: `DELETE FROM DEPARTMENT
WHERE department_id = 1;`,
    expectedBehavior:
      "The delete is rejected because PROVIDER.department_id uses ON DELETE RESTRICT.",
    runnable: false
  },
  {
    id: "crud-6-11",
    number: "6.11",
    title: "SELECT: patient upcoming appointments",
    category: "CRUD",
    scenario: "A patient views upcoming scheduled appointments.",
    sql: `SELECT appointment_id, appointment_date::text, start_time::text, end_time::text, reason
FROM APPOINTMENT
WHERE patient_id = 1
  AND appointment_date >= CURRENT_DATE
  AND status_id = 1
ORDER BY appointment_date, start_time;`,
    expectedBehavior:
      "Returns all future scheduled appointments for patient 1, ordered by date and time.",
    runnable: true
  },
  {
    id: "crud-6-12",
    number: "6.12",
    title: "SELECT: patients with no appointments",
    category: "CRUD",
    scenario: "An administrator finds patients who have never booked an appointment.",
    sql: `SELECT p.patient_id, u.first_name, u.last_name
FROM PATIENT p
JOIN "USER" u ON p.user_id = u.user_id
LEFT JOIN APPOINTMENT a ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;`,
    expectedBehavior:
      "Returns patients with zero appointments by keeping unmatched rows with a LEFT JOIN.",
    whyJoin:
      "The patient name lives in USER and missing appointments are detected with a LEFT JOIN.",
    runnable: true
  },
  {
    id: "advanced-7-1",
    number: "7.1",
    title: "Upcoming appointments with names",
    category: "Advanced",
    scenario: "View all upcoming appointments with patient and provider names.",
    sql: `SELECT a.appointment_id, a.appointment_date::text, a.start_time::text, a.end_time::text,
       pu.first_name AS patient_first, pu.last_name AS patient_last,
       pru.first_name AS provider_first, pru.last_name AS provider_last
FROM APPOINTMENT a
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
JOIN PROVIDER pr ON a.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id
WHERE a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.start_time;`,
    whyJoin:
      "Patient and provider names are stored in USER, so APPOINTMENT joins through PATIENT and PROVIDER.",
    whyGroupBy: "Not needed because the query lists detail rows.",
    expectedBehavior:
      "A readable schedule of future appointments with patient and provider names.",
    runnable: true
  },
  {
    id: "advanced-7-2",
    number: "7.2",
    title: "Cardiology providers and availability",
    category: "Advanced",
    scenario: "Find all providers in Cardiology along with weekly availability.",
    sql: `SELECT pru.first_name, pru.last_name, pr.specialty, pa.day_of_week,
       pa.start_time::text, pa.end_time::text
FROM PROVIDER pr
JOIN "USER" pru ON pr.user_id = pru.user_id
JOIN DEPARTMENT d ON pr.department_id = d.department_id
LEFT JOIN PROVIDER_AVAILABILITY pa ON pr.provider_id = pa.provider_id
WHERE d.department_name = 'Cardiology'
ORDER BY pru.last_name, pa.day_of_week;`,
    whyJoin:
      "Names come from USER, department names from DEPARTMENT, and work windows from PROVIDER_AVAILABILITY.",
    whyGroupBy: "Not used because each provider-availability row is shown individually.",
    expectedBehavior:
      "Cardiology providers and work windows; providers without availability still appear.",
    runnable: true
  },
  {
    id: "advanced-7-3",
    number: "7.3",
    title: "Patient appointment history",
    category: "Advanced",
    scenario: "Get one patient's appointment history with status names and provider names.",
    sql: `SELECT a.appointment_id, a.appointment_date::text, a.start_time::text,
       a.reason, s.status_name, pru.first_name AS provider_first,
       pru.last_name AS provider_last
FROM APPOINTMENT a
JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
JOIN PROVIDER pr ON a.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id
WHERE a.patient_id = 1
ORDER BY a.appointment_date DESC;`,
    whyJoin:
      "Status labels live in APPOINTMENT_STATUS and provider names live in USER through PROVIDER.",
    whyGroupBy: "Not needed because the result is a detailed history.",
    expectedBehavior:
      "The selected patient's appointments with readable status labels and provider names.",
    runnable: true
  },
  {
    id: "advanced-7-4",
    number: "7.4",
    title: "Appointments per department",
    category: "Advanced",
    scenario: "Count how many appointments each department has.",
    sql: `SELECT d.department_name, COUNT(a.appointment_id)::int AS total_appointments
FROM DEPARTMENT d
LEFT JOIN APPOINTMENT a ON d.department_id = a.department_id
GROUP BY d.department_name
ORDER BY total_appointments DESC;`,
    whyJoin:
      "Department names come from DEPARTMENT while appointment facts come from APPOINTMENT.",
    whyGroupBy: "GROUP BY rolls appointment rows up to one summary row per department.",
    expectedBehavior:
      "Each department and its appointment count, including departments with zero appointments.",
    runnable: true
  },
  {
    id: "advanced-7-5",
    number: "7.5",
    title: "Cancelled appointments and actor",
    category: "Advanced",
    scenario: "Find all cancelled appointments and identify who cancelled them.",
    sql: `SELECT a.appointment_id, a.appointment_date::text,
       pu.first_name AS patient_first, pu.last_name AS patient_last,
       cu.first_name AS cancelled_by_first, cu.last_name AS cancelled_by_last,
       al.change_timestamp::text, al.change_reason
FROM APPOINTMENT a
JOIN APPOINTMENT_AUDIT_LOG al ON a.appointment_id = al.appointment_id
JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
JOIN "USER" cu ON al.changed_by = cu.user_id
WHERE ns.status_name = 'Cancelled';`,
    whyJoin:
      "The audit log records who made the change, and status labels require the lookup table.",
    whyGroupBy: "Not required because each cancellation event remains visible.",
    expectedBehavior:
      "Cancelled appointments with patient name, cancelling user, timestamp, and reason.",
    runnable: true
  },
  {
    id: "advanced-7-6",
    number: "7.6",
    title: "Double-booking detector",
    category: "Advanced",
    scenario:
      "Detect double-bookings by finding overlapping appointments for the same provider.",
    sql: `SELECT a1.appointment_id AS appt1, a2.appointment_id AS appt2,
       a1.appointment_date::text, a1.start_time::text AS start1,
       a1.end_time::text AS end1, a2.start_time::text AS start2,
       a2.end_time::text AS end2, pru.first_name, pru.last_name
FROM APPOINTMENT a1
JOIN APPOINTMENT a2
  ON a1.provider_id = a2.provider_id
 AND a1.appointment_date = a2.appointment_date
 AND a1.appointment_id < a2.appointment_id
 AND a1.start_time < a2.end_time
 AND a2.start_time < a1.end_time
JOIN PROVIDER pr ON a1.provider_id = pr.provider_id
JOIN "USER" pru ON pr.user_id = pru.user_id;`,
    whyJoin:
      "A self-join compares appointment pairs, then joins resolve the provider name.",
    whyGroupBy: "Not used because the goal is to show conflicting detail rows.",
    expectedBehavior: "Any overlapping appointment pairs; ideally no rows are returned.",
    runnable: true
  },
  {
    id: "advanced-7-7",
    number: "7.7",
    title: "Providers with zero appointments",
    category: "Advanced",
    scenario: "Find providers who currently have zero appointments scheduled.",
    sql: `SELECT pru.first_name, pru.last_name, pr.specialty, d.department_name
FROM PROVIDER pr
JOIN "USER" pru ON pr.user_id = pru.user_id
JOIN DEPARTMENT d ON pr.department_id = d.department_id
LEFT JOIN APPOINTMENT a ON pr.provider_id = a.provider_id
WHERE a.appointment_id IS NULL;`,
    whyJoin:
      "Provider name and department live outside APPOINTMENT; LEFT JOIN detects missing appointments.",
    whyGroupBy: "Not used because the query searches for unmatched rows.",
    expectedBehavior: "Providers without appointments, including specialty and department.",
    runnable: true
  },
  {
    id: "advanced-7-8",
    number: "7.8",
    title: "Appointment audit trail",
    category: "Advanced",
    scenario: "Show the full audit trail for a specific appointment.",
    sql: `SELECT al.log_id, al.change_timestamp::text,
       os.status_name AS old_status, ns.status_name AS new_status,
       u.first_name AS changed_by_first, u.last_name AS changed_by_last,
       al.change_reason
FROM APPOINTMENT_AUDIT_LOG al
JOIN "USER" u ON al.changed_by = u.user_id
LEFT JOIN APPOINTMENT_STATUS os ON al.old_status_id = os.status_id
LEFT JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
WHERE al.appointment_id = 1
ORDER BY al.change_timestamp;`,
    whyJoin:
      "Old/new status labels live in APPOINTMENT_STATUS, and changed-by user lives in USER.",
    whyGroupBy: "Not used because each audit event should remain visible.",
    expectedBehavior: "A chronological status-change history for one appointment.",
    runnable: true
  },
  {
    id: "advanced-7-9",
    number: "7.9",
    title: "High-frequency patients",
    category: "Advanced",
    scenario: "Find patients with more than three appointments in the last 30 days.",
    sql: `SELECT pu.first_name, pu.last_name, COUNT(a.appointment_id)::int AS appt_count
FROM APPOINTMENT a
JOIN PATIENT pt ON a.patient_id = pt.patient_id
JOIN "USER" pu ON pt.user_id = pu.user_id
WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY pu.first_name, pu.last_name
HAVING COUNT(a.appointment_id) > 3;`,
    whyJoin:
      "The appointment count must be tied back to patient names through PATIENT and USER.",
    whyGroupBy:
      "GROUP BY and HAVING count appointments per patient and filter high-frequency patients.",
    expectedBehavior: "Patients with high appointment volume in the last 30 days.",
    runnable: true
  },
  {
    id: "advanced-7-10",
    number: "7.10",
    title: "Today's full schedule",
    category: "Advanced",
    scenario: "List today's full schedule with department, provider, patient, and status.",
    sql: `SELECT a.appointment_id, a.start_time::text, a.end_time::text, a.reason,
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
ORDER BY a.start_time;`,
    whyJoin:
      "APPOINTMENT stores IDs; joins resolve patient, provider, department, and status labels.",
    whyGroupBy: "Not used because this is an operational schedule, not an aggregate.",
    expectedBehavior: "Every appointment scheduled for today with all important labels resolved.",
    runnable: true
  }
];

export function getQueryDefinition(id: string) {
  return queryCatalog.find((item) => item.id === id);
}
