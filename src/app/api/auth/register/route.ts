import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { registerLocalUser } from "@/modules/auth/services/registration.service";

export async function POST(req: Request) {
  let submittedUser: { fullname?: unknown; email?: unknown } = {};
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await connectDb();
    const registrationInput = body && typeof body === "object" && !Array.isArray(body)
      ? body as { fullname?: unknown; email?: unknown; password?: unknown }
      : {};
    submittedUser = registrationInput;
    await registerLocalUser({
      fullname: registrationInput.fullname,
      email: registrationInput.email,
      password: registrationInput.password,
    });

    return NextResponse.json(
      {
        user: {
          fullname: typeof submittedUser.fullname === "string" ? submittedUser.fullname.trim() : "",
          email: typeof submittedUser.email === "string" ? submittedUser.email.trim().toLowerCase() : "",
        },
        message: "If this email can be registered, check your inbox for next steps.",
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    const registrationError = error as { cause?: string; message?: string; code?: number };
    if (registrationError.cause === "VALIDATION") {
      return NextResponse.json(
        { error: registrationError.message },
        { status: 400 }
      );
    }

    if (registrationError.cause === "CONFLICT" || registrationError.code === 11000) {
      return NextResponse.json(
        {
          user: {
            fullname: typeof submittedUser.fullname === "string" ? submittedUser.fullname.trim() : "",
            email: typeof submittedUser.email === "string" ? submittedUser.email.trim().toLowerCase() : "",
          },
          message: "If this email can be registered, check your inbox for next steps.",
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
