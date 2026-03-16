import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpenBooking Protocol",
    template: "%s | OpenBooking",
  },
  description:
    "Book services openly with the OpenBooking Protocol — a federated, open-source booking platform.",
  keywords: ["booking", "appointments", "scheduling", "open source", "federated"],
  openGraph: {
    type: "website",
    siteName: "OpenBooking Protocol",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
