import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { registerLocalUser } from "@/modules/auth/registration.service";

export async function POST(req: Request) {
  try {
    await connectDb();

    const body = await req.json();
    const user = await registerLocalUser(body ?? {});

    return NextResponse.json(
      {
        user: {
          fullname: user.fullname,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const registrationError = error as { cause?: string; message?: string; code?: number };
    if (registrationError.cause === "CONFLICT") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (registrationError.cause === "VALIDATION") {
      return NextResponse.json(
        { error: registrationError.message },
        { status: 400 }
      );
    }

    if (registrationError.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
