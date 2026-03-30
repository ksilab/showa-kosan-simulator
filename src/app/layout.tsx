import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "不動産 簡易査定シミュレーター｜昭和興産",
  description: "約1分で、あなたの土地・建物の目安額がわかります。群馬県内の土地・一戸建てに対応。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
