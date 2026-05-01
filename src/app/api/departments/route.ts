import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getDepartments().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createDepartment).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updateDepartment).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteDepartment(idFromSearch(request, "Department")));
  } catch (error) {
    return fail(error);
  }
}
