import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { AppError, query } from "@/lib/db";
import { createAppointment } from "@/lib/tables";

export const dynamic = "force-dynamic";

const edgeCases = {
  duplicateEmail: {
    title: "Duplicate email",
    action:
      "Try to insert a second user with john.doe@email.com, which already exists in USER.",
    expected: "UNIQUE(email) rejects the insert."
  },
  invalidTime: {
    title: "Invalid appointment time",
    action: "Try to create an appointment where end_time is earlier than start_time.",
    expected: "CHECK(end_time > start_time) and UI validation reject the request."
  },
  restrictedDepartment: {
    title: "Delete dependent department",
    action: "Try to delete Cardiology while providers and appointments still reference it.",
    expected: "ON DELETE RESTRICT blocks the delete."
  },
  invalidReference: {
    title: "Invalid reference",
    action: "Try to create an appointment for patient_id 999.",
    expected: "Foreign key validation rejects the missing patient reference."
  },
  conflictingBooking: {
    title: "Conflicting provider booking",
    action: "Try to book Dr. Alice Brown over an existing 2026-04-15 09:00 slot.",
    expected: "The serializable app transaction rejects the overlap before insert."
  }
} as const;

export async function GET() {
  return ok(edgeCases);
}

export async function POST(request: NextRequest) {
  try {
    const { id } = await readJson(request);
    if (typeof id !== "string" || !(id in edgeCases)) {
      throw new AppError("Unknown edge case.", 404);
    }

    const result = await runEdgeCase(id as keyof typeof edgeCases);
    return ok({
      ...edgeCases[id as keyof typeof edgeCases],
      systemResponse: result
    });
  } catch (error) {
    const mapped = fail(error);
    return mapped;
  }
}

async function runEdgeCase(id: keyof typeof edgeCases) {
  if (id === "duplicateEmail") {
    await query(
      `INSERT INTO "USER"
       VALUES (99, 'Duplicate', 'Email', 'john.doe@email.com', 'hash', '509-555-9999', 'patient', CURRENT_TIMESTAMP)`
    );
  }

  if (id === "invalidTime") {
    await query(
      `INSERT INTO APPOINTMENT
       VALUES (99, 1, 1, 1, 1, '2026-05-01', '10:00', '09:00', 'Bad time', NULL, CURRENT_TIMESTAMP)`
    );
  }

  if (id === "restrictedDepartment") {
    await query("DELETE FROM DEPARTMENT WHERE department_id = 1");
  }

  if (id === "invalidReference") {
    await query(
      `INSERT INTO APPOINTMENT
       VALUES (99, 999, 1, 1, 1, '2026-05-01', '10:00', '10:30', 'Invalid patient', NULL, CURRENT_TIMESTAMP)`
    );
  }

  if (id === "conflictingBooking") {
    await createAppointment({
      patient_id: 2,
      provider_id: 1,
      department_id: 1,
      status_id: 1,
      appointment_date: "2026-04-15",
      start_time: "09:10",
      end_time: "09:40",
      reason: "Conflict demo",
      notes: "",
      changed_by: 5
    });
  }

  return "Unexpectedly succeeded.";
}
