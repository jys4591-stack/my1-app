import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "국유재산 현장사진 AI 도우미",
  description:
    "현장사진을 올리면 상황 분류, 유사 사례, 민원 답변 초안을 보여 주는 국유재산 관리 직원용 챗봇",
};

// 검색·AI가 앱의 성격을 이해하도록 돕는 구조화 데이터(JSON-LD). 화면(머리글)에 실제로 있는 내용만 담습니다.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "국유재산 현장사진 AI 도우미",
  description:
    "현장사진과 질문을 올리면 상황 분류, 유사 사례, 민원 답변 초안을 보여 드립니다.",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "ko",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* JSON.stringify는 HTML을 걸러 주지 않아서 <를 안전한 문자로 바꿉니다 (Next.js 문서 권장) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
