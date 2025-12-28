import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Trust Radar - Verify Twitter Account Trustworthiness",
  description:
    "Verify the trustworthiness of X (Twitter) accounts using advanced metadata analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
