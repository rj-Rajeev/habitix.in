export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", 401, "Unauthorized"),
  notFound: (entity: string) =>
    new AppError("NOT_FOUND", 404, `${entity} not found`),
  badRequest: (message: string, details?: unknown) =>
    new AppError("BAD_REQUEST", 400, message, details),
  forbidden: () => new AppError("FORBIDDEN", 403, "Forbidden"),
  conflict: (message: string) => new AppError("CONFLICT", 409, message),
  internal: (message = "Internal server error") =>
    new AppError("INTERNAL_ERROR", 500, message),
};
