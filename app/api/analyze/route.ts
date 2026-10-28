// 서버 API: POST /api/analyze (DESIGN.md 5절)
// PLAN 6 임시 버전: 글자 질문만 받아 Claude 답을 돌려줍니다.
// PLAN 9번에서 사진 + 질문(FormData)을 받도록 바꿉니다.
import Anthropic from "@anthropic-ai/sdk";
import {
  askClaudeText,
  ClaudeRefusalError,
  MissingApiKeyError,
} from "@/lib/claude";

// 질문 길이 제한 (DESIGN.md 5절: 1~500자)
const MAX_QUESTION_LENGTH = 500;

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let question: unknown;
  try {
    ({ question } = await request.json());
  } catch {
    return errorResponse(400, "요청 형식이 올바르지 않아요.");
  }

  if (typeof question !== "string" || question.trim() === "") {
    return errorResponse(400, "질문을 입력해 주세요.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(400, `질문은 ${MAX_QUESTION_LENGTH}자 이내로 입력해 주세요.`);
  }

  try {
    const answer = await askClaudeText(question.trim());
    return Response.json({ answer });
  } catch (error) {
    // 로그에는 질문 내용을 남기지 않고 오류 종류만 남깁니다 (DESIGN.md 8절)
    console.error("[api/analyze]", error instanceof Error ? error.name : error);

    if (error instanceof MissingApiKeyError) {
      return errorResponse(
        500,
        "서버에 Claude API 키가 설정되지 않았어요. .env의 ANTHROPIC_API_KEY를 확인해 주세요.",
      );
    }
    if (error instanceof ClaudeRefusalError) {
      return errorResponse(502, "이 요청은 분석할 수 없어요.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return errorResponse(502, "Claude API 키가 올바르지 않아요. 키를 다시 확인해 주세요.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "요청이 많아요. 잠시 후 다시 시도해 주세요.");
    }
    return errorResponse(502, "AI 응답에 문제가 있어요. 잠시 후 다시 시도해 주세요.");
  }
}
