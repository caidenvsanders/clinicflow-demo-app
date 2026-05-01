import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { signupAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return readJson(request)
    .then(signupAccount)
    .then((data) => ok(data, "Account created successfully."))
    .catch(fail);
}
