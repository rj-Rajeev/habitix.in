import { createPrivateKey, randomUUID } from "crypto";
import { importPKCS8, SignJWT } from "jose";
import { Types } from "mongoose";
import { Errors } from "@/lib/api";

const TOKEN_LIFETIME_SECONDS = 5 * 60;
const MIN_RSA_MODULUS_LENGTH = 2048;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function getSigningConfiguration() {
  const privateKeyPem = process.env.SOCKET_TOKEN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const issuer = process.env.SOCKET_TOKEN_ISSUER?.trim();
  const audience = process.env.SOCKET_TOKEN_AUDIENCE?.trim();

  if (!privateKeyPem || !issuer || !audience) {
    throw Errors.internal("Socket token signing is not configured");
  }

  try {
    const privateKey = createPrivateKey(privateKeyPem);
    if (
      privateKey.asymmetricKeyType !== "rsa" ||
      (privateKey.asymmetricKeyDetails?.modulusLength ?? 0) < MIN_RSA_MODULUS_LENGTH
    ) {
      throw new Error("Invalid RSA key");
    }
  } catch {
    throw Errors.internal("Socket token signing is not configured correctly");
  }

  return { privateKeyPem, issuer, audience };
}

export async function issueSocketToken(userId: string) {
  if (!OBJECT_ID_PATTERN.test(userId) || !Types.ObjectId.isValid(userId)) {
    throw Errors.internal("Authenticated user ID is invalid");
  }

  const { privateKeyPem, issuer, audience } = getSigningConfiguration();
  let signingKey;
  try {
    signingKey = await importPKCS8(privateKeyPem, "RS256");
  } catch {
    throw Errors.internal("Socket token signing is not configured correctly");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + TOKEN_LIFETIME_SECONDS;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setSubject(userId.toLowerCase())
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .setJti(randomUUID())
    .sign(signingKey);

  return {
    token,
    expiresIn: TOKEN_LIFETIME_SECONDS,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}
