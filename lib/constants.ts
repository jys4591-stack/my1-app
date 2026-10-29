// 화면(브라우저)과 서버가 함께 쓰는 상수
// zod 같은 무거운 도구를 부르지 않는 파일입니다. 브라우저 코드는 lib/types.ts 대신 여기서 상수를 가져와야
// 브라우저로 내려가는 코드가 가벼워집니다.

// 상황 분류 5개 (PRD.md 5번 must ①)
export const CATEGORIES = [
  "무단점유",
  "시설물 훼손",
  "불법 경작",
  "쓰레기 무단투기",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

// 확신도가 이 값 미만이면 분류 대신 "판단 어려움"으로 답합니다. (PRD.md 5번)
export const CONFIDENCE_THRESHOLD = 60;
export const UNSURE_CATEGORY = "판단 어려움";

// 민원 답변 초안 규칙 (PRD.md 5번 must ②)
// 끝맺음 문구를 포함해 공백 포함 500자 이내로 합니다.
export const MAX_REPLY_LENGTH = 500;
export const REPLY_FOOTER = "※ AI 초안 — 담당자 검토 후 사용";

// 배포된 앱 주소 (sitemap, robots, 구조화 데이터에서 씁니다)
export const SITE_URL = "https://my1-app.vercel.app";
