// 사례·결과 모양 정의 (DESIGN.md 4절)
// AI 답의 모양은 zod로 정해 두고, 약속한 모양이 아니면 화면에 내보내지 않습니다. (PLAN 10번)
import { z } from "zod";
import { CATEGORIES, UNSURE_CATEGORY, type Category } from "./constants";

// 상수는 lib/constants.ts에 있습니다. 서버 코드가 이 파일 하나에서 모두 가져올 수 있게 다시 내보냅니다.
// (브라우저 코드는 zod가 딸려 오지 않도록 lib/constants.ts에서 직접 가져옵니다)
export {
  CATEGORIES,
  CONFIDENCE_THRESHOLD,
  MAX_REPLY_LENGTH,
  REPLY_FOOTER,
  UNSURE_CATEGORY,
} from "./constants";
export type { Category } from "./constants";

// AI에게 받는 답의 모양 (DESIGN.md 4절 "AI 결과")
// 사진이 여러 장이어도 같은 현장으로 보고 분류 1개·확신도 1개를 냅니다. (PRD.md 5번)
export const ClassificationSchema = z.object({
  category: z.enum(CATEGORIES), // 5개 분류 중 가장 가까운 것
  confidence: z.number(), // 0~100 (AI 자체 추정치, 참고용)
  reason: z.string(), // 그렇게 판단한 이유 한두 문장
  answer: z.string(), // 질문에 대한 짧은 답
  similarCaseIds: z.array(z.string()), // 비슷한 사례 번호 (비슷한 순서, 목록에 있는 번호만)
  replyDraft: z.string(), // 민원 답변 초안 본문 (끝맺음 문구는 서버가 붙임, 업무 밖 요청이면 빈 글)
});

// AI가 낸 그대로의 답 (규칙을 적용하기 전)
export type RawClassification = z.infer<typeof ClassificationSchema>;

// 화면에 보여 줄 유사 사례 한 건: 출처는 사례 번호·제목 (PRD.md 5번)
export type SimilarCase = {
  id: string;
  title: string;
};

// 화면에 보여 줄 최종 분류 결과 (확신도 60% 미만이면 category가 "판단 어려움")
export type Classification = {
  category: Category | typeof UNSURE_CATEGORY;
  confidence: number; // 0~100 정수
  reason: string;
  answer: string;
  similarCases: SimilarCase[]; // 최대 3건, 없으면 빈 목록 → 화면에 "유사 사례 없음"
  replyDraft: string; // 끝맺음 문구까지 붙인 민원 답변 초안 (500자 이내, 없으면 빈 글)
  replyWarnings: string[]; // 초안에서 서버가 찾아낸 주의 사항 (예: 단정·약속으로 읽히는 표현)
};

// 사례 하나 = 6칸 (PRD.md 6번 범위)
export type Case = {
  id: string; // 사례 번호 (예: "C03")
  title: string; // 제목
  category: Category; // 분류 (5개 중 하나)
  situation: string; // 상황 설명
  action: string; // 조치 내용
  replyExample: string; // 민원 답변 예시
};

// 사진 올리기 줄에서 고른 사진 하나 (DESIGN.md 2절 ③)
export type PickedPhoto = {
  id: number;
  name: string; // 원래 파일 이름
  blob: Blob; // 긴 변 1568px JPG로 줄인 사진 (서버로 보낼 것)
  previewUrl: string; // 미리보기용 주소
};

// 대화 영역에 보이는 말풍선 하나 (DESIGN.md 2절 ②)
export type ChatMessage = {
  id: number;
  role: "user" | "assistant"; // 나 / AI
  text: string;
  photoUrls?: string[]; // 내가 보낸 사진 미리보기
  isError?: boolean; // 오류 안내 말풍선이면 빨간색으로 표시
  result?: Classification; // AI 분석 결과가 있으면 말풍선 대신 결과 카드로 보여 줌
};
