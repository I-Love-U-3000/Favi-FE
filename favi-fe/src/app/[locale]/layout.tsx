import type { Metadata } from "next";
import "../globals.css";
import { cookies } from "next/headers";
import "primereact/resources/themes/lara-light-blue/theme.css";  // theme mặc định
import "primereact/resources/primereact.min.css";               // core styles
import "primeicons/primeicons.css";                             // icons

// PrimeReact themes (import CSS trong main file, ví dụ: index.js, App.js hoặc layout.tsx)

// Saga
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/themes/saga-green/theme.css';
import 'primereact/resources/themes/saga-orange/theme.css';
import 'primereact/resources/themes/saga-purple/theme.css';

// Vela
import 'primereact/resources/themes/vela-blue/theme.css';
import 'primereact/resources/themes/vela-green/theme.css';
import 'primereact/resources/themes/vela-orange/theme.css';
import 'primereact/resources/themes/vela-purple/theme.css';

// Arya (Dark)
import 'primereact/resources/themes/arya-blue/theme.css';
import 'primereact/resources/themes/arya-green/theme.css';
import 'primereact/resources/themes/arya-orange/theme.css';
import 'primereact/resources/themes/arya-purple/theme.css';

// Mira
import 'primereact/resources/themes/mira/theme.css';

// Nano
import 'primereact/resources/themes/nano/theme.css';

// Rhea
import 'primereact/resources/themes/rhea/theme.css';

// Fluent
import 'primereact/resources/themes/fluent-light/theme.css';

// Lara (mới, phổ biến, light + dark)
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/themes/lara-light-purple/theme.css';
import 'primereact/resources/themes/lara-light-teal/theme.css';
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/themes/lara-dark-purple/theme.css';
import 'primereact/resources/themes/lara-dark-teal/theme.css';

import { PrimeReactProvider } from "primereact/api";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { RootProvider } from "@/components/RootProvider";
import Dock from "@/components/Dock";

import { NextIntlClientProvider } from "next-intl";


export const metadata: Metadata = {
  title: "Favi",
  description: "Capture the mood.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  const themeFromCookie = (await cookies()).get("theme")?.value ?? "";
  return (

    <html lang="en" className={themeFromCookie}>
      <head>
        <link
          id="theme-link"
          rel="stylesheet"
          href="/themes/lara-light-blue/theme.css"
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <Toast />
          <PrimeReactProvider value={{ ripple: true }}>
            <RootProvider>
              {children}
            </RootProvider>
          </PrimeReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
