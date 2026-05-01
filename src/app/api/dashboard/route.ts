import { ok, fail } from "@/lib/api";
import { query, syncOverdueAppointments } from "@/lib/db";
import { getLookups } from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await syncOverdueAppointments();
    const [
      counts,
      upcoming,
      departmentCounts,
      statusCounts,
      auditHighlights,
      doubleBookings
    ] = await Promise.all([
      query(`
        SELECT 'users' AS label, COUNT(*)::int AS count FROM "USER"
        UNION ALL SELECT 'patients', COUNT(*)::int FROM PATIENT
        UNION ALL SELECT 'providers', COUNT(*)::int FROM PROVIDER
        UNION ALL SELECT 'appointments', COUNT(*)::int FROM APPOINTMENT
      `),
      query(`
        SELECT a.appointment_id, a.appointment_date::text, a.start_time::text,
               a.end_time::text, a.reason, s.status_name,
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
        ORDER BY a.appointment_date, a.start_time
        LIMIT 8
      `),
      query(`
        SELECT d.department_name, COUNT(a.appointment_id)::int AS total_appointments
        FROM DEPARTMENT d
        LEFT JOIN APPOINTMENT a ON d.department_id = a.department_id
        GROUP BY d.department_name
        ORDER BY total_appointments DESC, d.department_name
      `),
      query(`
        SELECT s.status_name, COUNT(a.appointment_id)::int AS total
        FROM APPOINTMENT_STATUS s
        LEFT JOIN APPOINTMENT a ON s.status_id = a.status_id
        GROUP BY s.status_name
        ORDER BY s.status_name
      `),
      query(`
        SELECT al.log_id, al.change_timestamp::text, al.change_reason,
               u.first_name, u.last_name, ns.status_name AS new_status
        FROM APPOINTMENT_AUDIT_LOG al
        JOIN "USER" u ON al.changed_by = u.user_id
        LEFT JOIN APPOINTMENT_STATUS ns ON al.new_status_id = ns.status_id
        ORDER BY al.change_timestamp DESC, al.log_id DESC
        LIMIT 6
      `),
      query(`
        SELECT a1.appointment_id AS appt1, a2.appointment_id AS appt2
        FROM APPOINTMENT a1
        JOIN APPOINTMENT a2
          ON a1.provider_id = a2.provider_id
         AND a1.appointment_date = a2.appointment_date
         AND a1.appointment_id < a2.appointment_id
         AND a1.start_time < a2.end_time
         AND a2.start_time < a1.end_time
      `)
    ]);

    return ok({
      counts: counts.rows,
      upcoming: upcoming.rows,
      departmentCounts: departmentCounts.rows,
      statusCounts: statusCounts.rows,
      auditHighlights: auditHighlights.rows,
      doubleBookingCount: doubleBookings.rowCount,
      lookups: await getLookups()
    });
  } catch (error) {
    return fail(error);
  }
}
