export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { page?: number; total?: number };
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, meta?: ApiSuccess<T>["meta"]): ApiSuccess<T> {
  return { success: true, data, meta };
}

export function fail(
  code: string,
  message: string,
  details?: unknown
): ApiErrorBody {
  return { success: false, error: { code, message, details } };
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json(ok(data), init);
}

export function jsonFail(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return Response.json(fail(code, message, details), { status });
}
