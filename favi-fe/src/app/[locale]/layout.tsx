import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toast } from "primereact/toast";
import { RootProvider } from "@/components/RootProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { NextIntlClientProvider } from "next-intl";
import NavGate from "@/components/NavGate";

export const metadata: Metadata = {
  title: "Favi",
  description: "Capture the mood.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
