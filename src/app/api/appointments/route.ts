import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getAppointments().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request)
    .then(createAppointment)
    .then((data) => ok(data, "Appointment created with transaction checks."))
    .catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request)
    .then(updateAppointment)
    .then((data) => ok(data, "Appointment updated."))
    .catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteAppointment(idFromSearch(request, "Appointment")));
  } catch (error) {
    return fail(error);
  }
}
