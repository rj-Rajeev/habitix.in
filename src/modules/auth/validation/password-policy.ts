/** Local account passwords require 12+ Unicode code points and at most 72 UTF-8 bytes. */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_BYTES = 72;
export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and no more than 72 UTF-8 bytes.";

export function isPasswordPolicyValid(password: string): boolean {
  return (
    Array.from(password).length >= MIN_PASSWORD_LENGTH &&
    new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES
  );
}
