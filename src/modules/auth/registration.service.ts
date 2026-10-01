import registerUser from "@/lib/registerUser";
import { issueVerificationEmail } from "@/modules/auth/verification.service";

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
  if (!password || password.length < 6) {
    throw Object.assign(new Error("Password must be at least 6 characters long."), { cause: "VALIDATION" });
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
