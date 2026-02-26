import type { Metadata } from "next";
import { Montserrat, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 1. 기존 HTML에서 사용하던 폰트 로드
const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["800", "900"], 
  variable: '--font-montserrat' 
});

const notoSansKr = Noto_Sans_KR({ 
  subsets: ["latin"], 
  weight: ["400", "700", "900"],
  variable: '--font-noto-sans'
});

export const metadata: Metadata = {
  title: "Now:[ ] Pro Plus",
  description: "퍼포먼스 관제 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      {/* 2. body 전체에 기본 폰트(Noto Sans) 적용 및 튕김(Overscroll) 방지 */}
      <body className={`${notoSansKr.className} ${notoSansKr.variable} ${montserrat.variable} bg-[#121212] text-white overflow-hidden overscroll-y-none select-none`}>
        {children}
      </body>
    </html>
  );
}