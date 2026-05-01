import { PoolClient } from "pg";
import { AppError, nextId, query, syncOverdueAppointments, withTransaction } from "./db";
import {
  assertAppointmentLeadTime,
  assertTimeOrder,
  dateValue,
  dayNameFromDate,
  days,
  enumValue,
  genders,
  intValue,
  optionalString,
  requiredString,
  roles,
  timeValue
} from "./validation";

async function actorRole(client: PoolClient, userId: number) {
  const result = await client.query<{ role: string }>(
    `SELECT role FROM "USER" WHERE user_id = $1`,
    [userId]
  );
  if (!result.rowCount) {
    throw new AppError("Changed by user was not found.", 404);
  }
  return result.rows[0].role;
}

export async function getLookups() {
  const [
    users,
    patientUsers,
    providerUsers,
    departments,
    statuses,
    patients,
    providers,
    appointments
  ] =
    await Promise.all([
      query('SELECT user_id, first_name, last_name, role FROM "USER" ORDER BY user_id'),
      query(`SELECT u.user_id, u.first_name, u.last_name
             FROM "USER" u
             WHERE u.role = 'patient'
             ORDER BY u.user_id`),
      query(`SELECT u.user_id, u.first_name, u.last_name
             FROM "USER" u
             WHERE u.role = 'provider'
             ORDER BY u.user_id`),
      query("SELECT department_id, department_name FROM DEPARTMENT ORDER BY department_id"),
      query("SELECT status_id, status_name FROM APPOINTMENT_STATUS ORDER BY status_id"),
      query(`SELECT p.patient_id, u.first_name, u.last_name
             FROM PATIENT p JOIN "USER" u ON p.user_id = u.user_id
             ORDER BY p.patient_id`),
      query(`SELECT pr.provider_id, u.first_name, u.last_name, pr.department_id
             FROM PROVIDER pr JOIN "USER" u ON pr.user_id = u.user_id
             ORDER BY pr.provider_id`),
      query(`SELECT appointment_id, appointment_date::text, start_time::text
             FROM APPOINTMENT
             ORDER BY appointment_id`)
    ]);

  return {
    users: users.rows,
    patientUsers: patientUsers.rows,
    providerUsers: providerUsers.rows,
    departments: departments.rows,
    statuses: statuses.rows,
    patients: patients.rows,
    providers: providers.rows,
    appointments: appointments.rows
  };
}

export async function getUsers() {
  const result = await query(`
    SELECT user_id, first_name, last_name, email, phone, role, created_at::text
    FROM "USER"
    ORDER BY user_id
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createUser(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const userId = await nextId(client, "users");
    const role = enumValue(body.role, roles, "Role");
    const values = [
      userId,
      requiredString(body.first_name, "First name"),
      requiredString(body.last_name, "Last name"),
      requiredString(body.email, "Email"),
      requiredString(body.password_hash, "Password hash"),
      optionalString(body.phone),
      role
    ];
    const result = await client.query(
      `INSERT INTO "USER"
       (user_id, first_name, last_name, email, password_hash, phone, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
       RETURNING user_id, first_name, last_name, email, phone, role, created_at::text`,
      values
    );
    return result.rows[0];
  });
}

export async function updateUser(body: Record<string, unknown>) {
  const result = await query(
    `UPDATE "USER"
     SET first_name = $2, last_name = $3, email = $4, phone = $5, role = $6
     WHERE user_id = $1
     RETURNING user_id, first_name, last_name, email, phone, role, created_at::text`,
    [
      intValue(body.user_id, "User ID"),
      requiredString(body.first_name, "First name"),
      requiredString(body.last_name, "Last name"),
      requiredString(body.email, "Email"),
      optionalString(body.phone),
      enumValue(body.role, roles, "Role")
    ]
  );
  if (!result.rowCount) throw new AppError("User not found.", 404);
  return result.rows[0];
}

export async function deleteUser(id: number) {
  const result = await query('DELETE FROM "USER" WHERE user_id = $1 RETURNING user_id', [id]);
  if (!result.rowCount) throw new AppError("User not found.", 404);
  return result.rows[0];
}

export async function getPatients() {
  const result = await query(`
    SELECT p.patient_id, p.user_id, u.first_name, u.last_name, p.date_of_birth::text,
           p.gender, p.emergency_contact_name, p.emergency_contact_phone,
           p.insurance_provider, p.insurance_policy_number
    FROM PATIENT p
    JOIN "USER" u ON p.user_id = u.user_id
    ORDER BY p.patient_id
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createPatient(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const patientId = await nextId(client, "patients");
    const result = await client.query(
      `INSERT INTO PATIENT
       (patient_id, user_id, date_of_birth, gender, emergency_contact_name,
        emergency_contact_phone, insurance_provider, insurance_policy_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        patientId,
        intValue(body.user_id, "User ID"),
        dateValue(body.date_of_birth, "Date of birth"),
        enumValue(body.gender, genders, "Gender"),
        optionalString(body.emergency_contact_name),
        optionalString(body.emergency_contact_phone),
        optionalString(body.insurance_provider),
        optionalString(body.insurance_policy_number)
      ]
    );
    return result.rows[0];
  });
}

export async function updatePatient(body: Record<string, unknown>) {
  const result = await query(
    `UPDATE PATIENT
     SET date_of_birth = $2, gender = $3, emergency_contact_name = $4,
         emergency_contact_phone = $5, insurance_provider = $6, insurance_policy_number = $7
     WHERE patient_id = $1
     RETURNING *`,
    [
      intValue(body.patient_id, "Patient ID"),
      dateValue(body.date_of_birth, "Date of birth"),
      enumValue(body.gender, genders, "Gender"),
      optionalString(body.emergency_contact_name),
      optionalString(body.emergency_contact_phone),
      optionalString(body.insurance_provider),
      optionalString(body.insurance_policy_number)
    ]
  );
  if (!result.rowCount) throw new AppError("Patient not found.", 404);
  return result.rows[0];
}

export async function deletePatient(id: number) {
  const result = await query("DELETE FROM PATIENT WHERE patient_id = $1 RETURNING patient_id", [
    id
  ]);
  if (!result.rowCount) throw new AppError("Patient not found.", 404);
  return result.rows[0];
}

export async function getDepartments() {
  const result = await query(`
    SELECT d.department_id, d.department_name, d.location, d.phone,
           COUNT(DISTINCT pr.provider_id)::int AS providers,
           COUNT(DISTINCT a.appointment_id)::int AS appointments
    FROM DEPARTMENT d
    LEFT JOIN PROVIDER pr ON d.department_id = pr.department_id
    LEFT JOIN APPOINTMENT a ON d.department_id = a.department_id
    GROUP BY d.department_id, d.department_name, d.location, d.phone
    ORDER BY d.department_id
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createDepartment(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const departmentId = await nextId(client, "departments");
    const result = await client.query(
      `INSERT INTO DEPARTMENT (department_id, department_name, location, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        departmentId,
        requiredString(body.department_name, "Department name"),
        optionalString(body.location),
        optionalString(body.phone)
      ]
    );
    return result.rows[0];
  });
}

export async function updateDepartment(body: Record<string, unknown>) {
  const result = await query(
    `UPDATE DEPARTMENT
     SET department_name = $2, location = $3, phone = $4
     WHERE department_id = $1
     RETURNING *`,
    [
      intValue(body.department_id, "Department ID"),
      requiredString(body.department_name, "Department name"),
      optionalString(body.location),
      optionalString(body.phone)
    ]
  );
  if (!result.rowCount) throw new AppError("Department not found.", 404);
  return result.rows[0];
}

export async function deleteDepartment(id: number) {
  const result = await query(
    "DELETE FROM DEPARTMENT WHERE department_id = $1 RETURNING department_id",
    [id]
  );
  if (!result.rowCount) throw new AppError("Department not found.", 404);
  return result.rows[0];
}

export async function getProviders() {
  const result = await query(`
    SELECT pr.provider_id, pr.user_id, u.first_name, u.last_name, pr.department_id,
           d.department_name, pr.specialty, pr.license_number
    FROM PROVIDER pr
    JOIN "USER" u ON pr.user_id = u.user_id
    JOIN DEPARTMENT d ON pr.department_id = d.department_id
    ORDER BY pr.provider_id
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createProvider(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const providerId = await nextId(client, "providers");
    const result = await client.query(
      `INSERT INTO PROVIDER
       (provider_id, user_id, department_id, specialty, license_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        providerId,
        intValue(body.user_id, "User ID"),
        intValue(body.department_id, "Department ID"),
        requiredString(body.specialty, "Specialty"),
        requiredString(body.license_number, "License number")
      ]
    );
    return result.rows[0];
  });
}

export async function updateProvider(body: Record<string, unknown>) {
  const result = await query(
    `UPDATE PROVIDER
     SET department_id = $2, specialty = $3, license_number = $4
     WHERE provider_id = $1
     RETURNING *`,
    [
      intValue(body.provider_id, "Provider ID"),
      intValue(body.department_id, "Department ID"),
      requiredString(body.specialty, "Specialty"),
      requiredString(body.license_number, "License number")
    ]
  );
  if (!result.rowCount) throw new AppError("Provider not found.", 404);
  return result.rows[0];
}

export async function deleteProvider(id: number) {
  const result = await query("DELETE FROM PROVIDER WHERE provider_id = $1 RETURNING provider_id", [
    id
  ]);
  if (!result.rowCount) throw new AppError("Provider not found.", 404);
  return result.rows[0];
}

async function assertProviderAvailable(
  client: PoolClient,
  providerId: number,
  appointmentDate: string,
  startTime: string,
  endTime: string
) {
  const dayName = dayNameFromDate(appointmentDate);
  const availability = await client.query(
    `SELECT availability_id
     FROM PROVIDER_AVAILABILITY
     WHERE provider_id = $1
       AND day_of_week = $2
       AND start_time <= $3::time
       AND end_time >= $4::time
     LIMIT 1`,
    [providerId, dayName, startTime, endTime]
  );
  if (!availability.rowCount) {
    throw new AppError(
      `Provider is not available on ${dayName} from ${startTime} to ${endTime}.`
    );
  }
}

async function assertNoOverlap(
  client: PoolClient,
  providerId: number,
  appointmentDate: string,
  startTime: string,
  endTime: string,
  appointmentId?: number
) {
  const result = await client.query(
    `SELECT appointment_id
     FROM APPOINTMENT
     WHERE provider_id = $1
       AND appointment_date = $2
       AND status_id <> 3
       AND ($5::int IS NULL OR appointment_id <> $5::int)
       AND start_time < $4::time
       AND $3::time < end_time
     LIMIT 1`,
    [providerId, appointmentDate, startTime, endTime, appointmentId ?? null]
  );
  if (result.rowCount) {
    throw new AppError(
      "Conflicting provider booking rejected: another appointment overlaps this slot.",
      409
    );
  }
}

export async function getAppointments() {
  await syncOverdueAppointments();
  const result = await query(`
    SELECT a.appointment_id, a.patient_id, a.provider_id, a.department_id, a.status_id,
           a.appointment_date::text, a.start_time::text, a.end_time::text,
           a.reason, a.notes, a.created_at::text, s.status_name,
           pu.first_name AS patient_first, pu.last_name AS patient_last,
           pru.first_name AS provider_first, pru.last_name AS provider_last,
           d.department_name
    FROM APPOINTMENT a
    JOIN PATIENT pt ON a.patient_id = pt.patient_id
    JOIN "USER" pu ON pt.user_id = pu.user_id
    JOIN PROVIDER pr ON a.provider_id = pr.provider_id
    JOIN "USER" pru ON pr.user_id = pru.user_id
    JOIN DEPARTMENT d ON a.department_id = d.department_id
    JOIN APPOINTMENT_STATUS s ON a.status_id = s.status_id
    ORDER BY a.appointment_date, a.start_time, a.appointment_id
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createAppointment(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const appointmentId = await nextId(client, "appointments");
    const appointmentDate = dateValue(body.appointment_date, "Appointment date");
    const startTime = timeValue(body.start_time, "Start time");
    const endTime = timeValue(body.end_time, "End time");
    const providerId = intValue(body.provider_id, "Provider ID");
    const statusId = intValue(body.status_id, "Status ID");
    const changedBy = intValue(body.changed_by, "Changed by");
    const changedByRole = await actorRole(client, changedBy);
    await client.query("SELECT set_config('clinicflow.actor_role', $1, true)", [changedByRole]);
    assertTimeOrder(startTime, endTime);
    if (changedByRole !== "admin") {
      assertAppointmentLeadTime(appointmentDate, startTime);
    }
    await assertProviderAvailable(client, providerId, appointmentDate, startTime, endTime);
    await assertNoOverlap(client, providerId, appointmentDate, startTime, endTime);

    const result = await client.query(
      `INSERT INTO APPOINTMENT
       (appointment_id, patient_id, provider_id, department_id, status_id,
        appointment_date, start_time, end_time, reason, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
       RETURNING *`,
      [
        appointmentId,
        intValue(body.patient_id, "Patient ID"),
        providerId,
        intValue(body.department_id, "Department ID"),
        statusId,
        appointmentDate,
        startTime,
        endTime,
        optionalString(body.reason),
        optionalString(body.notes)
      ]
    );

    await insertAuditLog(client, appointmentId, changedBy, null, statusId, "Appointment created");
    return result.rows[0];
  }, "SERIALIZABLE");
}

export async function updateAppointment(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const appointmentId = intValue(body.appointment_id, "Appointment ID");
    const appointmentDate = dateValue(body.appointment_date, "Appointment date");
    const startTime = timeValue(body.start_time, "Start time");
    const endTime = timeValue(body.end_time, "End time");
    const providerId = intValue(body.provider_id, "Provider ID");
    const statusId = intValue(body.status_id, "Status ID");
    const changedBy = intValue(body.changed_by, "Changed by");
    const changedByRole = await actorRole(client, changedBy);
    await client.query("SELECT set_config('clinicflow.actor_role', $1, true)", [changedByRole]);
    assertTimeOrder(startTime, endTime);

    const current = await client.query<{
      status_id: number;
      appointment_date: string;
      start_time: string;
      end_time: string;
      patient_id: number;
      provider_id: number;
      department_id: number;
      reason: string | null;
      notes: string | null;
    }>(
      `SELECT status_id, appointment_date::text, start_time::text, end_time::text,
              patient_id, provider_id, department_id, reason, notes
       FROM APPOINTMENT
       WHERE appointment_id = $1`,
      [appointmentId]
    );
    if (!current.rowCount) throw new AppError("Appointment not found.", 404);

    const nextPatientId = intValue(body.patient_id, "Patient ID");
    const nextDepartmentId = intValue(body.department_id, "Department ID");
    const nextReason = optionalString(body.reason);
    const nextNotes = optionalString(body.notes);
    const timingChanged =
      current.rows[0].appointment_date !== appointmentDate ||
      current.rows[0].start_time.slice(0, 5) !== startTime ||
      current.rows[0].end_time.slice(0, 5) !== endTime;
    const detailsChanged =
      current.rows[0].patient_id !== nextPatientId ||
      current.rows[0].provider_id !== providerId ||
      current.rows[0].department_id !== nextDepartmentId ||
      (current.rows[0].reason ?? null) !== nextReason ||
      (current.rows[0].notes ?? null) !== nextNotes;
    const statusChanged = current.rows[0].status_id !== statusId;

    if (timingChanged) {
      if (changedByRole !== "admin") {
        assertAppointmentLeadTime(appointmentDate, startTime);
      }
    }

    await assertProviderAvailable(client, providerId, appointmentDate, startTime, endTime);
    await assertNoOverlap(client, providerId, appointmentDate, startTime, endTime, appointmentId);

    const result = await client.query(
      `UPDATE APPOINTMENT
       SET patient_id = $2, provider_id = $3, department_id = $4, status_id = $5,
           appointment_date = $6, start_time = $7, end_time = $8, reason = $9, notes = $10
       WHERE appointment_id = $1
       RETURNING *`,
      [
        appointmentId,
        nextPatientId,
        providerId,
        nextDepartmentId,
        statusId,
        appointmentDate,
        startTime,
        endTime,
        nextReason,
        nextNotes
      ]
    );

    if (statusChanged) {
      await insertAuditLog(
        client,
        appointmentId,
        changedBy,
        current.rows[0].status_id,
        statusId,
        optionalString(body.change_reason) ?? "Status updated"
      );
    } else if (timingChanged || detailsChanged) {
      await insertAuditLog(
        client,
        appointmentId,
        changedBy,
        current.rows[0].status_id,
        statusId,
        optionalString(body.change_reason) ?? "Appointment details updated"
      );
    }

    return result.rows[0];
  }, "SERIALIZABLE");
}

export async function deleteAppointment(id: number) {
  const result = await query(
    "DELETE FROM APPOINTMENT WHERE appointment_id = $1 RETURNING appointment_id",
    [id]
  );
  if (!result.rowCount) throw new AppError("Appointment not found.", 404);
  return result.rows[0];
}

async function insertAuditLog(
  client: PoolClient,
  appointmentId: number,
  changedBy: number,
  oldStatusId: number | null,
  newStatusId: number | null,
  reason: string
) {
  const logId = await nextId(client, "auditLog");
  await client.query(
    `INSERT INTO APPOINTMENT_AUDIT_LOG
     (log_id, appointment_id, changed_by, old_status_id, new_status_id,
      change_timestamp, change_reason)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', $6)`,
    [logId, appointmentId, changedBy, oldStatusId, newStatusId, reason]
  );
}

export async function getAvailability() {
  const result = await query(`
    SELECT pa.availability_id, pa.provider_id, u.first_name, u.last_name,
           pa.day_of_week, pa.start_time::text, pa.end_time::text
    FROM PROVIDER_AVAILABILITY pa
    JOIN PROVIDER pr ON pa.provider_id = pr.provider_id
    JOIN "USER" u ON pr.user_id = u.user_id
    ORDER BY pa.provider_id, pa.day_of_week, pa.start_time
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createAvailability(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const availabilityId = await nextId(client, "availability");
    const startTime = timeValue(body.start_time, "Start time");
    const endTime = timeValue(body.end_time, "End time");
    assertTimeOrder(startTime, endTime);
    const result = await client.query(
      `INSERT INTO PROVIDER_AVAILABILITY
       (availability_id, provider_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        availabilityId,
        intValue(body.provider_id, "Provider ID"),
        enumValue(body.day_of_week, days, "Day of week"),
        startTime,
        endTime
      ]
    );
    return result.rows[0];
  });
}

export async function updateAvailability(body: Record<string, unknown>) {
  const startTime = timeValue(body.start_time, "Start time");
  const endTime = timeValue(body.end_time, "End time");
  assertTimeOrder(startTime, endTime);
  const result = await query(
    `UPDATE PROVIDER_AVAILABILITY
     SET provider_id = $2, day_of_week = $3, start_time = $4, end_time = $5
     WHERE availability_id = $1
     RETURNING *`,
    [
      intValue(body.availability_id, "Availability ID"),
      intValue(body.provider_id, "Provider ID"),
      enumValue(body.day_of_week, days, "Day of week"),
      startTime,
      endTime
    ]
  );
  if (!result.rowCount) throw new AppError("Availability slot not found.", 404);
  return result.rows[0];
}

export async function deleteAvailability(id: number) {
  const result = await query(
    "DELETE FROM PROVIDER_AVAILABILITY WHERE availability_id = $1 RETURNING availability_id",
    [id]
  );
  if (!result.rowCount) throw new AppError("Availability slot not found.", 404);
  return result.rows[0];
}

export async function getAuditLog() {
  await syncOverdueAppointments();
  const result = await query(`
    SELECT al.log_id, al.appointment_id, al.changed_by,
           u.first_name AS changed_by_first, u.last_name AS changed_by_last,
           os.status_name AS old_status, ns.status_name AS new_status,
           al.old_status_id, al.new_status_id, al.change_timestamp::text, al.change_reason
    FROM APPOINTMENT_AUDIT_LOG al
    JOIN "USER" u ON al.changed_by = u.user_id
    LEFT JOIN APPOINTMENT_STATUS os ON al.old_status_id = os.status_id
    LEFT JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
    ORDER BY al.change_timestamp DESC, al.log_id DESC
  `);
  return { rows: result.rows, lookups: await getLookups() };
}

export async function createAuditLog(body: Record<string, unknown>) {
  return withTransaction(async (client) => {
    const logId = await nextId(client, "auditLog");
    const result = await client.query(
      `INSERT INTO APPOINTMENT_AUDIT_LOG
       (log_id, appointment_id, changed_by, old_status_id, new_status_id,
        change_timestamp, change_reason)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', $6)
       RETURNING *`,
      [
        logId,
        intValue(body.appointment_id, "Appointment ID"),
        intValue(body.changed_by, "Changed by"),
        body.old_status_id ? intValue(body.old_status_id, "Old status ID") : null,
        body.new_status_id ? intValue(body.new_status_id, "New status ID") : null,
        optionalString(body.change_reason)
      ]
    );
    return result.rows[0];
  });
}

export async function updateAuditLog(body: Record<string, unknown>) {
  const result = await query(
    `UPDATE APPOINTMENT_AUDIT_LOG
     SET changed_by = $2, old_status_id = $3, new_status_id = $4, change_reason = $5
     WHERE log_id = $1
     RETURNING *`,
    [
      intValue(body.log_id, "Log ID"),
      intValue(body.changed_by, "Changed by"),
      body.old_status_id ? intValue(body.old_status_id, "Old status ID") : null,
      body.new_status_id ? intValue(body.new_status_id, "New status ID") : null,
      optionalString(body.change_reason)
    ]
  );
  if (!result.rowCount) throw new AppError("Audit log entry not found.", 404);
  return result.rows[0];
}

export async function deleteAuditLog(id: number) {
  const result = await query(
    "DELETE FROM APPOINTMENT_AUDIT_LOG WHERE log_id = $1 RETURNING log_id",
    [id]
  );
  if (!result.rowCount) throw new AppError("Audit log entry not found.", 404);
  return result.rows[0];
}
