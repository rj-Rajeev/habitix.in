import { AppError } from "./errors";
import { jsonFail } from "./response";

export function handleRouteError(err: unknown): Response {
  if (err instanceof AppError) {
    return jsonFail(err.code, err.message, err.status, err.details);
  }
  console.error("[API]", err);
  return jsonFail("INTERNAL_ERROR", "Something went wrong", 500);
}
