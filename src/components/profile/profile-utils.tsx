import { Check } from "lucide-react";

export function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const body = payload as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
  }
  return fallback;
}

export async function readResponse(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readErrorMessage(payload, fallback));
  return payload;
}

export function Feedback({ children, tone }: { children: string; tone: "error" | "success" }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{tone === "success" && <Check className="mt-0.5 h-4 w-4 shrink-0" />}<span>{children}</span></div>;
}
