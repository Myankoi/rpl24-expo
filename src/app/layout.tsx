import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RPL Expo 2026", template: "%s — RPL Expo 2026" },
  description: "Katalog proyek dan People's Choice Voting RPL Expo 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
