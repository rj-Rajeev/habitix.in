import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { Errors, handleRouteError } from "@/lib/api";
import {
  authorizeSocketChatAction,
  type SocketChatAction,
} from "@/modules/people-chat/services/socket-authorization.service";
import dbConnect from "@/lib/db";

const SOCKET_ACTIONS: SocketChatAction[] = ["sendMessage", "typing"];
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const MIN_CREDENTIAL_BYTES = 32;

function isAuthorizedServiceRequest(request: NextRequest): boolean {
  const configuredCredential = process.env.SOCKET_INTERNAL_API_TOKEN;
  if (!configuredCredential || Buffer.byteLength(configuredCredential, "utf8") < MIN_CREDENTIAL_BYTES) {
    throw Errors.internal("Socket authorization is not configured");
  }

  const match = /^Bearer ([^\s]+)$/.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;

  const provided = Buffer.from(match[1], "utf8");
  const expected = Buffer.from(configuredCredential, "utf8");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function parseRequestBody(request: NextRequest): Promise<{
  action: SocketChatAction;
  chatId: string;
  userId: string;
  messageId?: string;
  text?: string;
}> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw Errors.badRequest("Invalid request body");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Errors.badRequest("Invalid request body");
  }

  const value = body as Record<string, unknown>;
  if (
    Object.keys(value).some((key) => !["action", "chatId", "userId", "messageId", "text"].includes(key)) ||
    typeof value.action !== "string" ||
    !SOCKET_ACTIONS.includes(value.action as SocketChatAction) ||
    typeof value.chatId !== "string" ||
    !OBJECT_ID_PATTERN.test(value.chatId) ||
    !Types.ObjectId.isValid(value.chatId) ||
    typeof value.userId !== "string" ||
    !OBJECT_ID_PATTERN.test(value.userId) ||
    !Types.ObjectId.isValid(value.userId)
  ) {
    throw Errors.badRequest("Invalid socket authorization request");
  }

  if (
    (value.action === "sendMessage" &&
      (typeof value.messageId !== "string" ||
        !OBJECT_ID_PATTERN.test(value.messageId) ||
        !Types.ObjectId.isValid(value.messageId) ||
        typeof value.text !== "string" ||
        !value.text.trim())) ||
    (value.action === "typing" &&
      (value.messageId !== undefined || value.text !== undefined))
  ) {
    throw Errors.badRequest("Invalid socket authorization request");
  }

  return {
    action: value.action as SocketChatAction,
    chatId: value.chatId.toLowerCase(),
    userId: value.userId.toLowerCase(),
    ...(typeof value.messageId === "string"
      ? { messageId: value.messageId.toLowerCase() }
      : {}),
    ...(typeof value.text === "string" ? { text: value.text } : {}),
  };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let responseStatus = 500;

  try {
    if (!isAuthorizedServiceRequest(request)) {
      throw Errors.unauthorized();
    }

    const input = await parseRequestBody(request);
    await dbConnect();
    const result = await authorizeSocketChatAction(input);
    const response = NextResponse.json(result);
    responseStatus = response.status;
    return response;
  } catch (error) {
    const response = handleRouteError(error);
    responseStatus = response.status;
    return response;
  } finally {
    console.info("[internal socket authorize]", {
      requestReceived: true,
      responseStatus,
      elapsedMs: Date.now() - startedAt,
    });
  }
}
