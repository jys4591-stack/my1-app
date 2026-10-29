import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// 검색엔진 안내: 화면은 읽어도 되지만 AI 분석 API(/api/)는 읽지 않게 합니다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
