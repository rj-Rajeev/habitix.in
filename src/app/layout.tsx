// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/SessionProvider";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper"; // New wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Habitix",
  description: "Make your life better!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
