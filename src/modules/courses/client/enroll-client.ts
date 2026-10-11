type PaymentDetails = { keyId: string; orderId: string; amount: number; currency: string };
type PaymentResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: PaymentResponse) => void;
  modal: { ondismiss: () => void };
};
type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };

function loadRazorpay() {
  if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment checkout is unavailable."));
    document.body.appendChild(script);
  });
}

async function readPayload(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error("Enrollment could not be completed.");
  return payload?.data ?? payload;
}

/** Uses Habitix's existing enrollment and payment APIs; callers must recheck access afterward. */
export async function enrollInCourse(courseId: string, courseTitle: string): Promise<void> {
  const enrollmentResponse = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
  const result = await readPayload(enrollmentResponse);
  if (!result.requiresPayment) return;

  const payment = result.payment as PaymentDetails | null;
  if (!payment?.keyId || !payment.orderId) throw new Error("Payment checkout is unavailable.");
  await loadRazorpay();
  const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!Razorpay) throw new Error("Payment checkout is unavailable.");

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let confirmingPayment = false;
    const fail = () => {
      if (settled || confirmingPayment) return;
      settled = true;
      reject(new Error("Payment could not be verified. Please try again."));
    };
    const checkout = new Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: "Habitix",
      description: courseTitle,
      order_id: payment.orderId,
      handler: async (paymentResponse) => {
        confirmingPayment = true;
        try {
          const confirmation = await fetch(`/api/courses/${courseId}/enroll/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              signature: paymentResponse.razorpay_signature,
            }),
          });
          await readPayload(confirmation);
          if (!settled) {
            settled = true;
            resolve();
          }
        } catch {
          fail();
        }
      },
      modal: { ondismiss: fail },
    });
    checkout.open();
  });
}
