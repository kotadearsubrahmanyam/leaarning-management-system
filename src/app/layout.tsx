import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/providers";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { MouseTrail } from "@/components/ui/mouse-trail";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Portal",
  description: "A modern Learning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NotificationProvider>
            <MouseTrail />
            <Navbar />
            {children}
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
