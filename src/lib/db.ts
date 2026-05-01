import { Pool, PoolClient, QueryResultRow } from "pg";

type GlobalWithPool = typeof globalThis & { healthcarePool?: Pool };
export const CLINIC_TIME_ZONE = "America/Los_Angeles";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_scheduling";

const globalForPool = globalThis as GlobalWithPool;

export const pool =
  globalForPool.healthcarePool ??
  new Pool({
    connectionString,
    max: 10,
    options: `-c timezone=${CLINIC_TIME_ZONE}`
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.healthcarePool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}

export async function syncOverdueAppointments() {
  return query<{ sync_overdue_scheduled_appointments: number }>(
    "SELECT sync_overdue_scheduled_appointments()"
  );
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  isolation: "READ COMMITTED" | "SERIALIZABLE" = "READ COMMITTED"
) {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolation}`);
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const idTargets = {
  users: { table: '"USER"', column: "user_id" },
  patients: { table: "PATIENT", column: "patient_id" },
  providers: { table: "PROVIDER", column: "provider_id" },
  departments: { table: "DEPARTMENT", column: "department_id" },
  appointments: { table: "APPOINTMENT", column: "appointment_id" },
  availability: { table: "PROVIDER_AVAILABILITY", column: "availability_id" },
  auditLog: { table: "APPOINTMENT_AUDIT_LOG", column: "log_id" }
} as const;

export async function nextId(
  client: PoolClient,
  key: keyof typeof idTargets
) {
  const target = idTargets[key];
  await client.query(`LOCK TABLE ${target.table} IN EXCLUSIVE MODE`);
  const result = await client.query<{ next_id: number }>(
    `SELECT COALESCE(MAX(${target.column}), 0) + 1 AS next_id FROM ${target.table}`
  );
  return result.rows[0].next_id;
}

export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: string
  ) {
    super(message);
  }
}

export function mapDbError(error: unknown) {
  const pgError = error as { code?: string; detail?: string; message?: string };

  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { ok: false, error: error.message, details: error.details }
    };
  }

  if (pgError.code === "23505") {
    return {
      status: 409,
      body: {
        ok: false,
        error: "Duplicate data was rejected by a UNIQUE constraint.",
        details: pgError.detail
      }
    };
  }

  if (pgError.code === "23503") {
    return {
      status: 409,
      body: {
        ok: false,
        error:
          "The database rejected this because it would break a relationship or restricted delete rule.",
        details: pgError.detail
      }
    };
  }

  if (pgError.code === "23514") {
    const specificMessage =
      pgError.message?.includes("Appointments must be scheduled at least 24 hours in advance.")
        ? "Appointments must be scheduled at least 24 hours in advance."
        : null;
    return {
      status: 400,
      body: {
        ok: false,
        error: specificMessage ?? "The database rejected this because a CHECK constraint failed.",
        details: specificMessage ? undefined : pgError.detail
      }
    };
  }

  if (pgError.code === "40001") {
    return {
      status: 409,
      body: {
        ok: false,
        error:
          "A concurrent scheduling conflict occurred. Please retry with a different slot.",
        details: pgError.message
      }
    };
  }

  return {
    status: 500,
    body: {
      ok: false,
      error: "Unexpected server error.",
      details: pgError.message
    }
  };
}
