import { query, withTransaction, nextId, AppError, syncOverdueAppointments } from "./db";
import {
  createAppointment,
  createAvailability,
  deleteAvailability,
  updateAppointment,
  updateAvailability,
  updatePatient,
  updateUser
} from "./tables";
import { DoctorCard, SessionUser } from "./types";
import {
  dateValue,
  days,
  enumValue,
  genders,
  intValue,
  optionalString,
  requiredString,
  roles,
  timeValue
} from "./validation";

function toSessionUser(row: Record<string, unknown>): SessionUser {
  return {
    userId: Number(row.user_id),
    role: String(row.role) as SessionUser["role"],
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    patientId: row.patient_id ? Number(row.patient_id) : null,
    providerId: row.provider_id ? Number(row.provider_id) : null,
    departmentId: row.department_id ? Number(row.department_id) : null,
    specialty: row.specialty ? String(row.specialty) : null
  };
}

export async function loginAccount(body: Record<string, unknown>) {
  const email = requiredString(body.email, "Email");
  const passwordHash = requiredString(body.password_hash, "Password");
  const result = await query(
    `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role,
            p.patient_id, pr.provider_id, pr.department_id, pr.specialty
     FROM "USER" u
     LEFT JOIN PATIENT p ON u.user_id = p.user_id
     LEFT JOIN PROVIDER pr ON u.user_id = pr.user_id
     WHERE u.email = $1 AND u.password_hash = $2`,
    [email, passwordHash]
  );

  if (!result.rowCount) {
    throw new AppError("Invalid email or password.", 401);
  }

  return toSessionUser(result.rows[0]);
}

export async function signupAccount(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const role = enumValue(body.role, roles, "Role");
    const userId = await nextId(client, "users");

    await client.query(
      `INSERT INTO "USER"
       (user_id, first_name, last_name, email, password_hash, phone, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')`,
      [
        userId,
        requiredString(body.first_name, "First name"),
        requiredString(body.last_name, "Last name"),
        requiredString(body.email, "Email"),
        requiredString(body.password_hash, "Password"),
        optionalString(body.phone),
        role
      ]
    );

    let patientId: number | null = null;
    let providerId: number | null = null;
    let departmentId: number | null = null;
    let specialty: string | null = null;

    if (role === "patient") {
      patientId = await nextId(client, "patients");
      await client.query(
        `INSERT INTO PATIENT
         (patient_id, user_id, date_of_birth, gender, emergency_contact_name,
          emergency_contact_phone, insurance_provider, insurance_policy_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          patientId,
          userId,
          dateValue(body.date_of_birth, "Date of birth"),
          enumValue(body.gender, genders, "Gender"),
          optionalString(body.emergency_contact_name),
          optionalString(body.emergency_contact_phone),
          optionalString(body.insurance_provider),
          optionalString(body.insurance_policy_number)
        ]
      );
    }

    if (role === "provider") {
      providerId = await nextId(client, "providers");
      departmentId = intValue(body.department_id, "Department");
      specialty = requiredString(body.specialty, "Specialty");
      await client.query(
        `INSERT INTO PROVIDER
         (provider_id, user_id, department_id, specialty, license_number)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          providerId,
          userId,
          departmentId,
          specialty,
          requiredString(body.license_number, "License number")
        ]
      );
    }

    return {
      userId,
      role,
      firstName: requiredString(body.first_name, "First name"),
      lastName: requiredString(body.last_name, "Last name"),
      email: requiredString(body.email, "Email"),
      patientId,
      providerId,
      departmentId,
      specialty
    } satisfies SessionUser;
  });
}

export async function getDoctorDirectory() {
  const result = await query<DoctorCard>(
    `SELECT pr.provider_id, pr.department_id, d.department_name,
            u.first_name, u.last_name, pr.specialty,
            STRING_AGG(
              pa.day_of_week || ' ' || pa.start_time::text || '-' || pa.end_time::text,
              ', ' ORDER BY pa.day_of_week, pa.start_time
            ) AS availability_summary
     FROM PROVIDER pr
     JOIN "USER" u ON pr.user_id = u.user_id
     JOIN DEPARTMENT d ON pr.department_id = d.department_id
     LEFT JOIN PROVIDER_AVAILABILITY pa ON pr.provider_id = pa.provider_id
     GROUP BY pr.provider_id, pr.department_id, d.department_name, u.first_name, u.last_name, pr.specialty
     ORDER BY d.department_name, u.last_name, u.first_name`
  );
  return result.rows;
}

export async function getSignupLookups() {
  const departments = await query(
    `SELECT department_id, department_name
     FROM DEPARTMENT
     ORDER BY department_name`
  );
  return { departments: departments.rows };
}

export async function getPatientPortal(userId: number) {
  await syncOverdueAppointments();
  const patient = await query(
    `SELECT p.patient_id, p.date_of_birth::text, p.gender, p.emergency_contact_name,
            p.emergency_contact_phone, p.insurance_provider, p.insurance_policy_number,
            u.first_name, u.last_name, u.email, u.phone
     FROM PATIENT p
     JOIN "USER" u ON p.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  if (!patient.rowCount) throw new AppError("Patient profile not found.", 404);

  const appointments = await query(
    `SELECT a.appointment_id, a.appointment_date::text, a.start_time::text, a.end_time::text,
            a.reason, a.notes, a.status_id, s.status_name, d.department_name,
            pr.provider_id, pru.first_name AS provider_first, pru.last_name AS provider_last, pr.specialty
     FROM APPOINTMENT a
     JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
     JOIN DEPARTMENT d ON a.department_id = d.department_id
     JOIN PROVIDER pr ON a.provider_id = pr.provider_id
     JOIN "USER" pru ON pr.user_id = pru.user_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [patient.rows[0].patient_id]
  );

  return {
    profile: patient.rows[0],
    doctors: await getDoctorDirectory(),
    appointments: appointments.rows
  };
}

export async function getProviderPortal(userId: number) {
  await syncOverdueAppointments();
  const provider = await query(
    `SELECT pr.provider_id, pr.department_id, pr.specialty, pr.license_number,
            d.department_name, u.first_name, u.last_name, u.email, u.phone
     FROM PROVIDER pr
     JOIN "USER" u ON pr.user_id = u.user_id
     JOIN DEPARTMENT d ON pr.department_id = d.department_id
     WHERE u.user_id = $1`,
    [userId]
  );
  if (!provider.rowCount) throw new AppError("Provider profile not found.", 404);

  const appointments = await query(
    `SELECT a.appointment_id, a.appointment_date::text, a.start_time::text, a.end_time::text,
            a.reason, a.notes, a.status_id, s.status_name, d.department_name,
            p.patient_id, pu.first_name AS patient_first, pu.last_name AS patient_last,
            pu.email AS patient_email, pu.phone AS patient_phone
     FROM APPOINTMENT a
     JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
     JOIN PATIENT p ON a.patient_id = p.patient_id
     JOIN "USER" pu ON p.user_id = pu.user_id
     JOIN DEPARTMENT d ON a.department_id = d.department_id
     WHERE a.provider_id = $1
     ORDER BY a.appointment_date, a.start_time`,
    [provider.rows[0].provider_id]
  );

  const availability = await query(
    `SELECT availability_id, day_of_week, start_time::text, end_time::text
     FROM PROVIDER_AVAILABILITY
     WHERE provider_id = $1
     ORDER BY day_of_week, start_time`,
    [provider.rows[0].provider_id]
  );

  const statuses = await query(
    `SELECT status_id, status_name
     FROM APPOINTMENT_STATUS
     ORDER BY status_id`
  );

  return {
    profile: provider.rows[0],
    appointments: appointments.rows,
    availability: availability.rows,
    statuses: statuses.rows
  };
}

export async function updateProviderAppointmentStatus(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const appointmentId = intValue(body.appointment_id, "Appointment ID");
  const statusId = intValue(body.status_id, "Status ID");

  const owned = await query(
    `SELECT a.appointment_id, a.patient_id, a.provider_id, a.department_id, a.status_id,
            a.appointment_date::text, a.start_time::text, a.end_time::text, a.reason, a.notes
     FROM APPOINTMENT a
     JOIN PROVIDER pr ON a.provider_id = pr.provider_id
     WHERE a.appointment_id = $1 AND pr.user_id = $2`,
    [appointmentId, userId]
  );
  if (!owned.rowCount) {
    throw new AppError("Appointment not found for this provider.", 404);
  }

  await updateAppointment({
    appointment_id: appointmentId,
    patient_id: owned.rows[0].patient_id,
    provider_id: owned.rows[0].provider_id,
    department_id: owned.rows[0].department_id,
    status_id: statusId,
    appointment_date: owned.rows[0].appointment_date,
    start_time: owned.rows[0].start_time,
    end_time: owned.rows[0].end_time,
    reason: owned.rows[0].reason,
    notes: owned.rows[0].notes,
    changed_by: userId,
    change_reason: optionalString(body.change_reason) ?? "Provider updated appointment status"
  });

  return getProviderPortal(userId);
}

export async function bookPatientAppointment(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const patient = await query(`SELECT patient_id FROM PATIENT WHERE user_id = $1`, [userId]);
  if (!patient.rowCount) throw new AppError("Patient profile not found.", 404);

  const provider = await query(
    `SELECT provider_id, department_id FROM PROVIDER WHERE provider_id = $1`,
    [intValue(body.provider_id, "Provider ID")]
  );
  if (!provider.rowCount) throw new AppError("Provider not found.", 404);

  const scheduled = await query(
    `SELECT status_id FROM APPOINTMENT_STATUS WHERE status_name = 'Scheduled'`
  );

  return createAppointment({
    patient_id: patient.rows[0].patient_id,
    provider_id: provider.rows[0].provider_id,
    department_id: provider.rows[0].department_id,
    status_id: scheduled.rows[0].status_id,
    appointment_date: dateValue(body.appointment_date, "Appointment date"),
    start_time: timeValue(body.start_time, "Start time"),
    end_time: timeValue(body.end_time, "End time"),
    reason: optionalString(body.reason),
    notes: optionalString(body.notes),
    changed_by: userId
  });
}

export async function reschedulePatientAppointment(body: Record<string, unknown>) {
  const appointmentId = intValue(body.appointment_id, "Appointment ID");
  const userId = intValue(body.user_id, "User ID");
  const existing = await query(
    `SELECT a.appointment_id, a.patient_id, a.provider_id, a.department_id, a.status_id,
            a.reason, a.notes
     FROM APPOINTMENT a
     JOIN PATIENT p ON a.patient_id = p.patient_id
     WHERE a.appointment_id = $1 AND p.user_id = $2`,
    [appointmentId, userId]
  );
  if (!existing.rowCount) throw new AppError("Appointment not found for this patient.", 404);

  return updateAppointment({
    appointment_id: appointmentId,
    patient_id: existing.rows[0].patient_id,
    provider_id: existing.rows[0].provider_id,
    department_id: existing.rows[0].department_id,
    status_id: existing.rows[0].status_id,
    appointment_date: dateValue(body.appointment_date, "Appointment date"),
    start_time: timeValue(body.start_time, "Start time"),
    end_time: timeValue(body.end_time, "End time"),
    reason: optionalString(body.reason) ?? existing.rows[0].reason,
    notes: optionalString(body.notes) ?? existing.rows[0].notes,
    changed_by: userId,
    change_reason: optionalString(body.change_reason) ?? "Patient rescheduled appointment"
  });
}

export async function cancelPatientAppointment(body: Record<string, unknown>) {
  const appointmentId = intValue(body.appointment_id, "Appointment ID");
  const userId = intValue(body.user_id, "User ID");
  const existing = await query(
    `SELECT a.appointment_id, a.patient_id, a.provider_id, a.department_id, a.status_id,
            a.appointment_date::text, a.start_time::text, a.end_time::text, a.reason, a.notes
     FROM APPOINTMENT a
     JOIN PATIENT p ON a.patient_id = p.patient_id
     WHERE a.appointment_id = $1 AND p.user_id = $2`,
    [appointmentId, userId]
  );
  if (!existing.rowCount) throw new AppError("Appointment not found for this patient.", 404);

  const cancelled = await query(
    `SELECT status_id FROM APPOINTMENT_STATUS WHERE status_name = 'Cancelled'`
  );

  return updateAppointment({
    appointment_id: appointmentId,
    patient_id: existing.rows[0].patient_id,
    provider_id: existing.rows[0].provider_id,
    department_id: existing.rows[0].department_id,
    status_id: cancelled.rows[0].status_id,
    appointment_date: existing.rows[0].appointment_date,
    start_time: existing.rows[0].start_time,
    end_time: existing.rows[0].end_time,
    reason: existing.rows[0].reason,
    notes: existing.rows[0].notes,
    changed_by: userId,
    change_reason: optionalString(body.change_reason) ?? "Patient cancelled appointment"
  });
}

export async function updatePatientProfile(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const patient = await query(
    `SELECT p.patient_id, u.user_id, u.role
     FROM PATIENT p
     JOIN "USER" u ON p.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  if (!patient.rowCount) throw new AppError("Patient profile not found.", 404);

  await updateUser({
    user_id: userId,
    first_name: requiredString(body.first_name, "First name"),
    last_name: requiredString(body.last_name, "Last name"),
    email: requiredString(body.email, "Email"),
    phone: optionalString(body.phone),
    role: "patient"
  });

  await updatePatient({
    patient_id: patient.rows[0].patient_id,
    date_of_birth: dateValue(body.date_of_birth, "Date of birth"),
    gender: enumValue(body.gender, genders, "Gender"),
    emergency_contact_name: optionalString(body.emergency_contact_name),
    emergency_contact_phone: optionalString(body.emergency_contact_phone),
    insurance_provider: optionalString(body.insurance_provider),
    insurance_policy_number: optionalString(body.insurance_policy_number)
  });

  return getPatientPortal(userId);
}

export async function createProviderAvailabilityForUser(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const provider = await query(`SELECT provider_id FROM PROVIDER WHERE user_id = $1`, [userId]);
  if (!provider.rowCount) throw new AppError("Provider profile not found.", 404);

  await createAvailability({
    provider_id: provider.rows[0].provider_id,
    day_of_week: enumValue(body.day_of_week, days, "Day of week"),
    start_time: timeValue(body.start_time, "Start time"),
    end_time: timeValue(body.end_time, "End time")
  });

  return getProviderPortal(userId);
}

export async function updateProviderAvailabilityForUser(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const provider = await query(`SELECT provider_id FROM PROVIDER WHERE user_id = $1`, [userId]);
  if (!provider.rowCount) throw new AppError("Provider profile not found.", 404);

  const owned = await query(
    `SELECT availability_id
     FROM PROVIDER_AVAILABILITY
     WHERE availability_id = $1 AND provider_id = $2`,
    [intValue(body.availability_id, "Availability ID"), provider.rows[0].provider_id]
  );
  if (!owned.rowCount) throw new AppError("Availability slot not found for this provider.", 404);

  await updateAvailability({
    availability_id: intValue(body.availability_id, "Availability ID"),
    provider_id: provider.rows[0].provider_id,
    day_of_week: enumValue(body.day_of_week, days, "Day of week"),
    start_time: timeValue(body.start_time, "Start time"),
    end_time: timeValue(body.end_time, "End time")
  });

  return getProviderPortal(userId);
}

export async function deleteProviderAvailabilityForUser(body: Record<string, unknown>) {
  const userId = intValue(body.user_id, "User ID");
  const provider = await query(`SELECT provider_id FROM PROVIDER WHERE user_id = $1`, [userId]);
  if (!provider.rowCount) throw new AppError("Provider profile not found.", 404);

  const availabilityId = intValue(body.availability_id, "Availability ID");
  const owned = await query(
    `SELECT availability_id
     FROM PROVIDER_AVAILABILITY
     WHERE availability_id = $1 AND provider_id = $2`,
    [availabilityId, provider.rows[0].provider_id]
  );
  if (!owned.rowCount) throw new AppError("Availability slot not found for this provider.", 404);

  await deleteAvailability(availabilityId);
  return getProviderPortal(userId);
}
