import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ★ Headerをインポート（パスはcomponentsフォルダの場所に合わせて調整してください）
import Header from "@/components/Header"; 
import Footer from "@/components/Footer"; 
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "なにわセレクトショップ", // タイトルをショップ名に変更
  description: "大阪・千日前の逸品をお届けします",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ★ ここにHeaderを置くことで、全ページに共通で表示されます */}
        <CartProvider>
          <Header /> 
          {/* children の中に、各ページのコンテンツ（カート画面など）が入ります */}
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}