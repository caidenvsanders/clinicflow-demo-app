import { NextRequest } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { loginAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return readJson(request).then(loginAccount).then((data) => ok(data)).catch(fail);
}
