"use client";

import React, { useState } from "react";
import Script from "next/script";
import { Button } from "@mui/material";
import { redirect } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  amount: number;
  buttonStyle: "contained" | "outlined";
  buttonText: string;
}

export default function PaymentButton({
  amount,
  buttonStyle,
  buttonText,
}: Props) {
  const [loading, setLoading] = useState(false);

  const makePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100, currency: "INR" }),
      });
      const { orderId } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amount * 100,
        currency: "INR",
        name: "Habitix",
        description: buttonText,
        order_id: orderId,
        handler: (response: any) => {
          alert(`Payment successful: ${response.razorpay_payment_id}`);
          redirect("/dashboard");
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (err: any) => {
        console.error(err);
        alert("Payment failed. Please try again.");
        setLoading(false);
      });
      rz.open();
    } catch (err) {
      console.error(err);
      alert("Unable to initiate payment.");
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <Button
        variant={buttonStyle}
        fullWidth
        className={
          buttonStyle === "contained"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 py-4"
            : "border-2 border-slate-800 text-slate-800 hover:bg-slate-50 py-4"
        }
        onClick={makePayment}
        disabled={loading}
      >
        {loading ? "Processing…" : buttonText}
      </Button>
    </>
  );
}
