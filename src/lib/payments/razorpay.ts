import crypto from "node:crypto";
import Razorpay from "razorpay";

const provider = "razorpay";

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
}

export async function createEnrollmentPayment(courseId: string, amount: number) {
  const { client, keyId } = getClient();
  const order = await client.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `course_${courseId}_${Date.now()}`,
  });
  return { provider, keyId, orderId: order.id, amount: order.amount, currency: order.currency };
}

export function verifyEnrollmentPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getClient();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
}

export function getPaymentKeyId() {
  return getClient().keyId;
}