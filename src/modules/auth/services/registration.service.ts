import registerUser from "@/modules/auth/repositories/account.repository";
import {
  isPasswordPolicyValid,
  PASSWORD_POLICY_MESSAGE,
} from "@/modules/auth/validation/password-policy";
import { issueVerificationEmail } from "@/modules/auth/services/verification.service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerLocalUser(input: {
  fullname: unknown;
  email: unknown;
  password: unknown;
}) {
  const fullname = typeof input.fullname === "string" ? input.fullname.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!fullname || fullname.length > 100) {
    throw Object.assign(new Error("Enter a name of 1 to 100 characters."), { cause: "VALIDATION" });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw Object.assign(new Error("Enter a valid email address."), { cause: "VALIDATION" });
  }
  if (!isPasswordPolicyValid(password)) {
    throw Object.assign(new Error(PASSWORD_POLICY_MESSAGE), { cause: "VALIDATION" });
  }

  const user = await registerUser({ fullname, email, password, emailVerified: false });
  try {
    await issueVerificationEmail(user);
  } catch (error) {
    // Avoid leaving an account the user cannot activate if delivery/configuration fails.
    await user.deleteOne();
    throw error;
  }
  return user;
}
