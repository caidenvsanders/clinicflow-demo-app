import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getPatientPortal } from "@/lib/auth";
import { AppError } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError("Valid userId is required.");
    }
    return ok(await getPatientPortal(userId));
  } catch (error) {
    return fail(error);
  }
}
