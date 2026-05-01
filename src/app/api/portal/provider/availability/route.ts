import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import {
  createProviderAvailabilityForUser,
  deleteProviderAvailabilityForUser,
  updateProviderAvailabilityForUser
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return readJson(request)
    .then(createProviderAvailabilityForUser)
    .then((data) => ok(data, "Availability slot added."))
    .catch(fail);
}

export async function PUT(request: NextRequest) {
  return readJson(request)
    .then(updateProviderAvailabilityForUser)
    .then((data) => ok(data, "Availability slot updated."))
    .catch(fail);
}

export async function DELETE(request: NextRequest) {
  return readJson(request)
    .then(deleteProviderAvailabilityForUser)
    .then((data) => ok(data, "Availability slot removed."))
    .catch(fail);
}
