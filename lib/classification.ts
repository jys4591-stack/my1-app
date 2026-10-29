// 분류 규칙 후처리 (DESIGN.md 3절 ⑧)
// AI가 낸 분류를 PRD 규칙에 맞게 고칩니다. API 키와 무관한 순수 계산이라 따로 두었습니다.
import {
  CONFIDENCE_THRESHOLD,
  UNSURE_CATEGORY,
  type Classification,
} from "./types";

type RawClassification = {
  category: Exclude<Classification["category"], typeof UNSURE_CATEGORY>;
  confidence: number;
  reason: string;
  answer: string;
};

// 확신도를 0~100 정수로 맞추고, 60% 미만이면 분류를 "판단 어려움"으로 바꿉니다.
export function applyConfidenceRule(raw: RawClassification): Classification {
  const confidence = Number.isFinite(raw.confidence)
    ? Math.min(100, Math.max(0, Math.round(raw.confidence)))
    : 0;

  return {
    category: confidence < CONFIDENCE_THRESHOLD ? UNSURE_CATEGORY : raw.category,
    confidence,
    reason: raw.reason.trim(),
    answer: raw.answer.trim(),
  };
}
