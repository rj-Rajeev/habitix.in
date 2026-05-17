import { connectDb } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDb();
    const dbState = mongoose.connection.readyState;
    const healthy = dbState === 1;

    return Response.json(
      {
        status: healthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        database: healthy ? "connected" : "disconnected",
      },
      { status: healthy ? 200 : 503 }
    );
  } catch {
    return Response.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "unavailable",
      },
      { status: 503 }
    );
  }
}
