import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toast } from "primereact/toast";
import { RootProvider } from "@/components/RootProvider";
import { NextIntlClientProvider } from "next-intl";

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
            <RootProvider>
              {children}
            </RootProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
