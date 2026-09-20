import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RPL Expo", template: "%s — RPL Expo" },
  description: "Katalog proyek dan People's Choice Voting RPL Expo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
