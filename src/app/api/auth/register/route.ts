import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import registerUser from "@/lib/registerUser";

export async function POST(req: Request) {
  try {
    await connectDb();

    const body = await req.json();
    const fullname = typeof body?.fullname === "string" ? body.fullname.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!fullname || !email || !password) {
      return NextResponse.json(
        { error: "Fullname, email, and password are required" },
        { status: 400 }
      );
    }

    const user = await registerUser({
      fullname,
      email,
      password,
    });

    return NextResponse.json(
      {
        user: {
          fullname: user.fullname,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.cause === "CONFLICT") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    if (error?.cause === "VALIDATION") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}