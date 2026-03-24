import { initSocket } from "@/lib/socket";

export async function GET(req: Request) {
  // This triggers socket initialization
  return new Response("Socket initialized");
}