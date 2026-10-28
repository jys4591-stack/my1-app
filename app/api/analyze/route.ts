// 서버 API: POST /api/analyze (DESIGN.md 5절)
// 사진(1~3장) + 질문을 FormData로 받아 다시 검사한 뒤 Claude 답을 돌려줍니다.
import Anthropic from "@anthropic-ai/sdk";
import {
  askClaudeAboutPhotos,
  ClaudeRefusalError,
  MissingApiKeyError,
  type PhotoInput,
} from "@/lib/claude";

// 서버 쪽 다시 검사 기준 (DESIGN.md 3절 ④)
const MAX_QUESTION_LENGTH = 500; // 질문 1~500자
const MAX_PHOTOS = 3; // 사진 1~3장
// 화면에서 줄여 보내므로 장당 5MB를 넘을 일이 없습니다. 넘으면 줄이기를 건너뛴 요청으로 봅니다.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function isAllowedType(type: string): type is PhotoInput["mediaType"] {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "요청 형식이 올바르지 않아요.");
  }

  const question = formData.get("question");
  if (typeof question !== "string" || question.trim() === "") {
    return errorResponse(400, "질문을 입력해 주세요.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(400, `질문은 ${MAX_QUESTION_LENGTH}자 이내로 입력해 주세요.`);
  }

  const files = formData.getAll("photos");
  if (files.length === 0) {
    return errorResponse(400, "사진을 1장 이상 올려 주세요.");
  }
  if (files.length > MAX_PHOTOS) {
    return errorResponse(400, `사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
  }

  const photos: PhotoInput[] = [];
  for (const file of files) {
    if (!(file instanceof File) || !isAllowedType(file.type)) {
      return errorResponse(400, "JPG·PNG 사진만 올릴 수 있어요.");
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return errorResponse(400, "사진 용량이 너무 커요. 다시 올려 주세요.");
    }
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    photos.push({ mediaType: file.type, base64 });
  }

  try {
    const answer = await askClaudeAboutPhotos(question.trim(), photos);
    return Response.json({ answer });
  } catch (error) {
    // 로그에는 사진·질문 내용을 남기지 않고 오류 종류만 남깁니다 (DESIGN.md 8절)
    console.error("[api/analyze]", error instanceof Error ? error.name : error);

    if (error instanceof MissingApiKeyError) {
      return errorResponse(
        500,
        "서버에 Claude API 키가 설정되지 않았어요. .env의 ANTHROPIC_API_KEY를 확인해 주세요.",
      );
    }
    if (error instanceof ClaudeRefusalError) {
      return errorResponse(502, "이 사진은 분석할 수 없어요.");
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
