import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashpack — Your deployment workspace",
  description: "Build, deploy and manage your applications from one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
