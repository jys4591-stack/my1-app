// 서버 API: POST /api/analyze (DESIGN.md 5절)
// 사진(1~3장) + 질문을 FormData로 받아 다시 검사한 뒤 Claude 답을 돌려줍니다.
import Anthropic from "@anthropic-ai/sdk";
import {
  askClaudeAboutPhotos,
  ClaudeRefusalError,
  ClaudeFormatError,
  MissingApiKeyError,
  type PhotoInput,
} from "@/lib/claude";

// Vercel에서 이 함수가 붙잡혀 있을 수 있는 최대 시간(초)
export const maxDuration = 60;

// 서버 쪽 다시 검사 기준 (DESIGN.md 3절 ④)
const MAX_QUESTION_LENGTH = 500; // 질문 1~500자
const MAX_PHOTOS = 3; // 사진 1~3장
// 화면에서 긴 변 1568px JPG로 줄여 보내면 보통 1MB 아래입니다.
// 3장 합계가 Vercel 한도(약 4.5MB) 안에 들도록 장당 1.5MB로 묶습니다.
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;

// 방문자에게 보여 줄 공통 오류 안내 (키·설정 같은 내부 사정은 알려 주지 않음)
const AI_ERROR = "AI 응답에 문제가 있어요. 잠시 후 다시 시도해 주세요.";

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function isAllowedType(type: string): type is PhotoInput["mediaType"] {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

// 파일 첫 바이트로 실제 JPG·PNG인지 확인 (보낸 쪽이 붙인 이름표 file.type만 믿지 않음)
function matchesImageSignature(bytes: Uint8Array, type: PhotoInput["mediaType"]) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  );
}

// 다른 웹사이트에서 방문자의 브라우저를 시켜 보낸 요청은 거절합니다.
// (Origin 헤더가 없는 요청은 브라우저가 아닌 프로그램 요청이라 여기서는 막지 않습니다)
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "허용되지 않은 요청이에요.");
  }

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
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesImageSignature(bytes, file.type)) {
      return errorResponse(400, "JPG·PNG 사진만 올릴 수 있어요.");
    }
    photos.push({
      mediaType: file.type,
      base64: Buffer.from(bytes).toString("base64"),
    });
  }

  try {
    const classification = await askClaudeAboutPhotos(question.trim(), photos);
    return Response.json({ classification });
  } catch (error) {
    // 로그에는 사진·질문 내용을 남기지 않고 오류 종류만 남깁니다 (DESIGN.md 8절)
    console.error("[api/analyze]", error instanceof Error ? error.name : error);

    // 키가 없거나 틀린 경우는 서버 로그(오류 종류)로만 알리고, 화면에는 공통 안내만 보냅니다.
    if (error instanceof MissingApiKeyError || error instanceof ClaudeFormatError) {
      return errorResponse(500, AI_ERROR);
    }
    if (error instanceof ClaudeRefusalError) {
      return errorResponse(502, "이 사진은 분석할 수 없어요.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "요청이 많아요. 잠시 후 다시 시도해 주세요.");
    }
    return errorResponse(502, AI_ERROR);
  }
}
