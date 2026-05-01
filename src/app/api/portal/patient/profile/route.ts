import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { updatePatientProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  return readJson(request)
    .then(updatePatientProfile)
    .then((data) => ok(data, "Profile updated successfully."))
    .catch(fail);
}
