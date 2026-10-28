// Claude 호출 (DESIGN.md 6절 "Claude 사용 설정", 9절 lib/claude.ts)
// API 키를 쓰는 파일이라 서버에서만 불러옵니다. 화면 코드에서 불러오면 빌드가 실패합니다.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-opus-5-5";

// .env에 ANTHROPIC_API_KEY가 없을 때
export class MissingApiKeyError extends Error {}

// Claude가 안전 정책으로 답을 거절했을 때 (대체 모델까지 거절한 경우)
export class ClaudeRefusalError extends Error {}

// Claude에 보낼 사진 하나 (base64로 바꾼 것)
export type PhotoInput = {
  mediaType: "image/jpeg" | "image/png";
  base64: string;
};

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError("ANTHROPIC_API_KEY가 설정되지 않았어요.");
  }
  return new Anthropic({ apiKey });
}

// PLAN 9: 사진(1~3장) + 질문을 보내 답을 글로 받습니다.
// 상황 분류·유사 사례·답변 초안 규칙은 PLAN 10~12번에서 이 함수에 더합니다.
export async function askClaudeAboutPhotos(
  question: string,
  photos: PhotoInput[],
): Promise<string> {
  const client = createClient();

  const response = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium" }, // DESIGN.md 6절: 비용과 정확도의 균형
    // 거절되면 다른 모델이 이어서 답하도록 서버 측 대체 모델 사용 (DESIGN.md 6절)
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system:
      "당신은 국유재산 관리 직원을 돕는 도우미입니다. 사진 여러 장은 같은 현장을 찍은 것으로 보고, 사진 속 상황을 근거로 한국어로 짧고 정확하게 답하세요. 사진 속 사람 얼굴, 차량 번호, 주소 같은 개인정보는 글로 옮기지 마세요.",
    messages: [
      {
        role: "user",
        content: [
          ...photos.map((photo) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: photo.mediaType,
              data: photo.base64,
            },
          })),
          { type: "text" as const, text: question },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new ClaudeRefusalError("Claude가 이 요청에 답하지 않았어요.");
  }

  return response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
    .trim();
}
