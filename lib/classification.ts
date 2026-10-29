// 분류·유사 사례 규칙 후처리 (DESIGN.md 3절 ⑧)
// AI가 낸 답을 PRD 규칙에 맞게 고칩니다. API 키와 무관한 순수 계산이라 따로 두었습니다.
import {
  CONFIDENCE_THRESHOLD,
  MAX_REPLY_LENGTH,
  REPLY_FOOTER,
  UNSURE_CATEGORY,
  type Case,
  type Classification,
  type RawClassification,
  type SimilarCase,
} from "./types";

// 유사 사례는 최대 3건 (PRD.md 5번)
export const MAX_SIMILAR_CASES = 3;

// 근거·짧은 답의 최대 글자 수. 사진 속 문구가 길게 따라 나오는 것을 막습니다.
export const MAX_REASON_LENGTH = 200;
export const MAX_ANSWER_LENGTH = 300;

// 확신도를 0~100 정수로 맞추고, 60% 미만이면 분류를 "판단 어려움"으로 바꿉니다.
export function applyConfidenceRule(
  raw: RawClassification,
): Omit<Classification, "similarCases" | "replyDraft" | "replyWarnings"> {
  const confidence = Number.isFinite(raw.confidence)
    ? Math.min(100, Math.max(0, Math.round(raw.confidence)))
    : 0;

  return {
    category: confidence < CONFIDENCE_THRESHOLD ? UNSURE_CATEGORY : raw.category,
    confidence,
    // 근거·답에도 링크·전화번호를 지우고 길이를 묶습니다. (사진 속 문구가 그대로 따라 나오는 것 대비)
    reason: cleanText(raw.reason, MAX_REASON_LENGTH),
    answer: cleanText(raw.answer, MAX_ANSWER_LENGTH),
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

// 글자 수는 공백 포함, 글자 하나를 1로 셉니다. (이모지 같은 글자도 1개로)
function countChars(text: string): number {
  return [...text].length;
}

// 초안 안의 링크·전화번호·이메일은 지웁니다. (개인정보·피싱 링크가 민원인에게 나가는 것을 막음)
function removeContactInfo(text: string): string {
  return text
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[링크]")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[이메일]")
    // 국내 형식(010-1234-5678, 02-123-4567)과 국제 형식(+82-10-1234-5678) 모두
    .replace(/(?:\+82[-.\s]?\d{1,2}|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "[연락처]");
}

// 글이 maxLength를 넘으면 마지막 문장 끝에서 자릅니다. (문장 끝이 너무 앞이면 글자 수에서 자르고 … 표시)
function cutToLength(text: string, maxLength: number): string {
  const chars = [...text];
  if (chars.length <= maxLength) return text;

  const head = chars.slice(0, maxLength).join("");
  const lastEnd = Math.max(
    head.lastIndexOf("."),
    head.lastIndexOf("!"),
    head.lastIndexOf("?"),
  );
  if (lastEnd >= head.length * 0.5) return head.slice(0, lastEnd + 1).trim();
  return `${chars.slice(0, maxLength - 1).join("").trim()}…`;
}

// 민원 답변 초안 마무리 (PRD.md 5번 must ② 규칙, DESIGN.md 3절 ⑧)
// 1) 링크·전화번호·이메일을 지웁니다.
// 2) AI가 스스로 쓴 끝맺음 문구는 지우고, 서버가 정해진 문구를 맨 끝에 붙입니다.
// 3) 끝맺음 문구까지 합쳐 공백 포함 500자 이내가 되도록 본문을 줄입니다.
// 4) 본문이 비어 있으면(업무 밖 요청 등) 빈 글을 돌려줍니다.
export function finalizeReplyDraft(rawDraft: string): string {
  const withoutFooter = removeContactInfo(rawDraft)
    .replace(/※\s*AI\s*초안[^\n]*/g, "")
    .trim();
  if (withoutFooter === "") return "";

  const separator = "\n\n";
  const bodyMax =
    MAX_REPLY_LENGTH - countChars(REPLY_FOOTER) - countChars(separator);
  const body = cutToLength(withoutFooter, bodyMax);

  return `${body}${separator}${REPLY_FOOTER}`;
}

// 근거·짧은 답 같은 글을 정리합니다: 링크·전화번호·이메일 제거, 앞뒤 공백 제거, 길이 제한.
function cleanText(text: string, maxLength: number): string {
  return cutToLength(removeContactInfo(text).trim(), maxLength);
}

// 처분이나 결과를 단정하거나 약속하는 것으로 읽힐 수 있는 표현 (PRD.md 5번 must ②)
// 글을 몰래 고치지 않고, 담당자가 검토할 때 알아채도록 주의 문구만 붙입니다.
const RISKY_PHRASES = [
  "예정", // "~할 예정입니다" 대신 "~검토하겠습니다"
  "반드시",
  "약속",
  "보장",
  "허가되었",
  "허가하였",
  "승인되었",
  "승인하였",
  "면제",
];

// 초안에서 단정·약속으로 읽힐 수 있는 표현을 찾아 주의 문구를 돌려줍니다. 없으면 빈 목록입니다.
export function findReplyWarnings(draft: string): string[] {
  const found = RISKY_PHRASES.filter((phrase) => draft.includes(phrase));
  if (found.length === 0) return [];

  return [
    `초안에 ${found.map((phrase) => `"${phrase}"`).join(", ")} 표현이 있어요. 처분을 약속하거나 단정하는 말로 읽힐 수 있으니 "검토하겠습니다"처럼 고쳐서 사용해 주세요.`,
  ];
}
