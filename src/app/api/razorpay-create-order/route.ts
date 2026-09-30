import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This payment endpoint is no longer supported. Enroll through a course page." },
    { status: 410 }
  );
}
