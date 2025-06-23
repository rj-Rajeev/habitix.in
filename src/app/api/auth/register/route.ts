import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import registerUser from "@/lib/registerUser";

export async function POST(req: Request) {
  try {
    await connectDb();

    const body = await req.json();
    const { fullname, email, password } = body;

    if (!fullname || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const user = await registerUser({ fullname, email, password });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
