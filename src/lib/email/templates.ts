export function verificationEmail(url: string) {
  return {
    subject: "Verify your Habitix email",
    text: `Verify your Habitix email by opening this link: ${url}\n\nThis link expires in 24 hours and can only be used once.`,
    html: `<p>Welcome to Habitix.</p><p><a href="${url}">Verify your email</a></p><p>This link expires in 24 hours and can only be used once.</p>`,
  };
}
