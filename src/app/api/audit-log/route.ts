import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createAuditLog,
  deleteAuditLog,
  getAuditLog,
  updateAuditLog
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getAuditLog().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createAuditLog).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updateAuditLog).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteAuditLog(idFromSearch(request, "Audit log")));
  } catch (error) {
    return fail(error);
  }
}
