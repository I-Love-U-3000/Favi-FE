import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toast } from "primereact/toast";
import { RootProvider } from "@/components/RootProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { NextIntlClientProvider } from "next-intl";
import NavGate from "@/components/NavGate";
import { HeartbeatProvider } from "@/components/HeartbeatProvider";
import { CallProvider } from "@/components/CallProvider";
import GlobalIncomingCallDialog from "@/components/GlobalIncomingCallDialog";
import GlobalOutgoingCallDialog from "@/components/GlobalOutgoingCallDialog";
import GlobalActiveCallInterface from "@/components/GlobalActiveCallInterface";
import CallHubDebugIndicator from "@/components/CallHubDebugIndicator";
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
              <HeartbeatProvider />
              <CallProvider>
                <RootProvider>
                  <div className="min-h-screen flex">
                    <NavGate />
                    <main className="flex-1">{children}</main>
                  </div>
                </RootProvider>
                {/* Global incoming call dialog - appears on all pages */}
                <GlobalIncomingCallDialog />
                {/* Global outgoing call dialog - appears when initiating a call */}
                <GlobalOutgoingCallDialog />
                {/* Global active call interface - appears on all pages during active call */}
                <GlobalActiveCallInterface />
                {/* Debug indicator - shows CallHub connection status */}
                <CallHubDebugIndicator />
              </CallProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
