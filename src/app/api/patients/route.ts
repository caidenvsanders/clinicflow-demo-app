import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getPatients().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createPatient).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updatePatient).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deletePatient(idFromSearch(request, "Patient")));
  } catch (error) {
    return fail(error);
  }
}
