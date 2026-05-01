import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import {
  bookPatientAppointment,
  cancelPatientAppointment,
  reschedulePatientAppointment
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return readJson(request)
    .then(bookPatientAppointment)
    .then((data) => ok(data, "Appointment scheduled successfully."))
    .catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request)
    .then(reschedulePatientAppointment)
    .then((data) => ok(data, "Appointment rescheduled."))
    .catch(fail);
}

export async function DELETE(request: NextRequest) {
  return readJson(request)
    .then(cancelPatientAppointment)
    .then((data) => ok(data, "Appointment cancelled."))
    .catch(fail);
}
