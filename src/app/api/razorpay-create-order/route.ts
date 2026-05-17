import { NextResponse } from "next/server";
import Razorpay from "razorpay";

function getRazorpay() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Razorpay error:", error);
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 503 }
    );
  }
}
