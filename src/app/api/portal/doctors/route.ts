import { fail, ok } from "@/lib/api";
import { getDoctorDirectory } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return getDoctorDirectory().then((data) => ok(data)).catch(fail);
}
