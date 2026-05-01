import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  updateAvailability
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getAvailability().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createAvailability).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updateAvailability).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteAvailability(idFromSearch(request, "Availability")));
  } catch (error) {
    return fail(error);
  }
}
