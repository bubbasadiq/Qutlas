import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qutlas: Programmable Materials Manufacturing",
  description: "Matter, finally under instruction. Building the infrastructure to change how structural materials are made.",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
