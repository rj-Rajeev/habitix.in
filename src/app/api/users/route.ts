import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth/session";
import { getPeopleDirectory } from "@/modules/people-chat/services/people-directory.service";

export async function GET() {
  try {
    await dbConnect();

    const currentUserId = await getOptionalUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getPeopleDirectory(currentUserId);

    return NextResponse.json(users);

  } catch (error) {
    console.log(error);
    
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
