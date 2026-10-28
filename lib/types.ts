// 사례·결과 모양 정의 (DESIGN.md 4절)
// 지금은 일반 TypeScript 타입으로 두고, PLAN 10번에서 zod로 바꿉니다.

// 상황 분류 5개 (PRD.md 5번 must ①)
export const CATEGORIES = [
  "무단점유",
  "시설물 훼손",
  "불법 경작",
  "쓰레기 무단투기",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

// 사례 하나 = 6칸 (PRD.md 6번 범위)
export type Case = {
  id: string; // 사례 번호 (예: "C03")
  title: string; // 제목
  category: Category; // 분류 (5개 중 하나)
  situation: string; // 상황 설명
  action: string; // 조치 내용
  replyExample: string; // 민원 답변 예시
};

// 대화 영역에 보이는 말풍선 하나 (DESIGN.md 2절 ②)
export type ChatMessage = {
  id: number;
  role: "user" | "assistant"; // 나 / AI
  text: string;
};
