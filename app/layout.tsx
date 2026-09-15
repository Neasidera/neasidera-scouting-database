import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeaSidera Scouting",
  description:
    "Database professionale per calciatori, scout, agenti e club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
