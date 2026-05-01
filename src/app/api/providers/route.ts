import { NextRequest } from "next/server";
import { fail, idFromSearch, ok, readJson } from "@/lib/api";
import {
  createProvider,
  deleteProvider,
  getProviders,
  updateProvider
} from "@/lib/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  return getProviders().then((data) => ok(data)).catch(fail);
}

export async function POST(request: NextRequest) {
  return readJson(request).then(createProvider).then((data) => ok(data)).catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request).then(updateProvider).then((data) => ok(data)).catch(fail);
}

export async function DELETE(request: NextRequest) {
  try {
    return ok(await deleteProvider(idFromSearch(request, "Provider")));
  } catch (error) {
    return fail(error);
  }
}
