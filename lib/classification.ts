// 분류·유사 사례 규칙 후처리 (DESIGN.md 3절 ⑧)
// AI가 낸 답을 PRD 규칙에 맞게 고칩니다. API 키와 무관한 순수 계산이라 따로 두었습니다.
import {
  CONFIDENCE_THRESHOLD,
  UNSURE_CATEGORY,
  type Case,
  type Classification,
  type RawClassification,
  type SimilarCase,
} from "./types";

// 유사 사례는 최대 3건 (PRD.md 5번)
export const MAX_SIMILAR_CASES = 3;

// 확신도를 0~100 정수로 맞추고, 60% 미만이면 분류를 "판단 어려움"으로 바꿉니다.
export function applyConfidenceRule(
  raw: RawClassification,
): Omit<Classification, "similarCases"> {
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

// AI가 고른 사례 번호 중 "진짜 있는 번호"이면서 "결과 분류와 같은 분류"인 것만 남깁니다.
// - 없는 번호(지어낸 사례)와 중복은 버립니다.
// - 다른 분류의 사례는 버립니다. (PRD.md 5번: 같은 분류 사례 중에서 고름)
// - 분류가 "판단 어려움"이면 사례를 보여 주지 않습니다.
// - AI가 준 순서(비슷한 순서)를 지키고 최대 3건까지만 남깁니다.
export function pickSimilarCases(
  ids: string[],
  category: Classification["category"],
  cases: Case[],
): SimilarCase[] {
  if (category === UNSURE_CATEGORY) return [];

  const picked: SimilarCase[] = [];
  const seen = new Set<string>();

  for (const rawId of ids) {
    const id = rawId.trim();
    if (seen.has(id)) continue;
    seen.add(id);

    const found = cases.find((item) => item.id === id);
    if (!found || found.category !== category) continue;

    picked.push({ id: found.id, title: found.title });
    if (picked.length >= MAX_SIMILAR_CASES) break;
  }

  return picked;
}
