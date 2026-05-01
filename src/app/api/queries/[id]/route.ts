import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { AppError, query } from "@/lib/db";
import { getQueryDefinition } from "@/lib/query-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const definition = getQueryDefinition(id);
    if (!definition) throw new AppError("Query not found.", 404);

    if (!definition.runnable) {
      return ok({
        definition,
        rows: [],
        protected: true,
        message:
          "This report query mutates data, so the Query Explorer displays it without executing it. Use CRUD or Edge Case Lab for safe live demos."
      });
    }

    const result = await query(definition.sql);
    return ok({ definition, rows: result.rows, protected: false });
  } catch (error) {
    return fail(error);
  }
}
