import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toast } from "primereact/toast";
import { RootProvider } from "@/components/RootProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import NavGate from "@/components/NavGate";
import { HeartbeatProvider } from "@/components/HeartbeatProvider";
import { CallProvider } from "@/components/CallProvider";
import { SignalRProvider } from "@/lib/contexts/SignalRContext";
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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <Toast />
              <AuthProvider>
                <HeartbeatProvider />
                <SignalRProvider>
                  <CallProvider>
                    <RootProvider>
                      <div className="min-h-screen flex">
                        <NavGate />
                        <main className="flex-1">{children}</main>
                      </div>
                    </RootProvider>
                  </CallProvider>
                </SignalRProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
