import { NextRequest, NextResponse } from "next/server";
import { AppError, mapDbError } from "./db";

export const dynamic = "force-dynamic";

export async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new AppError("Request body must be valid JSON.");
  }
}

export function ok<T>(data: T, message?: string) {
  return NextResponse.json({ ok: true, data, message });
}

export function fail(error: unknown) {
  const mapped = mapDbError(error);
  return NextResponse.json(mapped.body, { status: mapped.status });
}

export function idFromSearch(request: NextRequest, label: string) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${label} id query parameter is required.`);
  }
  return id;
}
