import { fail, ok } from "@/lib/api";
import { getSignupLookups } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return getSignupLookups().then((data) => ok(data)).catch(fail);
}
