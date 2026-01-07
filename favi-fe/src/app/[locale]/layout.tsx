import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toast } from "primereact/toast";
import { RootProvider } from "@/components/RootProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { NextIntlClientProvider } from "next-intl";
import NavGate from "@/components/NavGate";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Favi",
  description: "Capture the mood.",
  icons: {
    icon: "/favi-logo.png",
    shortcut: "/favi-logo.png",
    apple: "/favi-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <ThemeProvider>
            <Toast />
            <AuthProvider>
              <RootProvider>
                <div className="min-h-screen flex">
                <NavGate />
                  <main className="flex-1">{children}</main>
                </div>
              </RootProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
