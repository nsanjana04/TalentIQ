import { NextRequest } from "next/server";
import type { z } from "zod";

export async function parseBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}

export function parseQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  return schema.parse(params);
}

export function parseParams<T extends z.ZodType>(
  params: Record<string, string>,
  schema: T
): z.infer<T> {
  return schema.parse(params);
}
