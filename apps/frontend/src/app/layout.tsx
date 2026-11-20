import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Enterprise Recruitment & Talent Management Portal",
  description:
    "End-to-end enterprise recruitment system, candidate application portal, and administrative hiring platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
