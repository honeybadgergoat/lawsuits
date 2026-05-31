import "@/app/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Judge Document Automation",
  description: "Prototype for legal case document automation"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
