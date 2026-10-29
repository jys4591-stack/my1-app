import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// 사이트 지도: 이 앱은 화면이 첫 페이지 1개뿐입니다.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }];
}
