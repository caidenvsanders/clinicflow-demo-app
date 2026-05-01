import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { updateProviderAppointmentStatus } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  return readJson(request)
    .then(updateProviderAppointmentStatus)
    .then((data) => ok(data, "Appointment status updated."))
    .catch(fail);
}
