import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // 모든 페이지에 기본 보안 헤더를 붙입니다
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 다른 사이트가 이 화면을 틀(iframe) 안에 몰래 띄우지 못하게 함
          { key: "X-Frame-Options", value: "DENY" },
          // 브라우저가 파일 종류를 멋대로 추측하지 않게 함
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 다른 사이트로 이동할 때 주소 전체를 넘기지 않게 함
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 쓰지 않는 기기 기능(위치·마이크·카메라)은 막음
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
