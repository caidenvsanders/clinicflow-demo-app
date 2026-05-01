import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getUsers().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createUser).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updateUser).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteUser(idFromSearch(request, "User")));
  } catch (error) {
    return fail(error);
  }
}
