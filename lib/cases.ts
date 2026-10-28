// 사례 자료 읽기 (DESIGN.md 9절 lib/cases.ts)
// data/cases.json을 불러와 6칸이 모두 있는지, 분류가 5개 중 하나인지 확인한 뒤 돌려줍니다.
import casesData from "@/data/cases.json";
import { CATEGORIES, type Case, type Category } from "@/lib/types";

const FIELDS = [
  "id",
  "title",
  "category",
  "situation",
  "action",
  "replyExample",
] as const;

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

// 사례 파일에 잘못 적힌 곳이 있으면 어느 사례인지 알려 주고 멈춥니다.
function checkCases(data: Record<string, string>[]): Case[] {
  const seenIds = new Set<string>();

  return data.map((item, index) => {
    const label = item.id ?? `${index + 1}번째 사례`;

    for (const field of FIELDS) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        throw new Error(`사례 자료 오류: ${label}의 "${field}" 칸이 비어 있어요.`);
      }
    }
    if (!isCategory(item.category)) {
      throw new Error(
        `사례 자료 오류: ${label}의 분류 "${item.category}"는 5개 분류(${CATEGORIES.join(", ")})에 없어요.`,
      );
    }
    if (seenIds.has(item.id)) {
      throw new Error(`사례 자료 오류: 사례 번호 ${item.id}가 두 번 있어요.`);
    }
    seenIds.add(item.id);

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      situation: item.situation,
      action: item.action,
      replyExample: item.replyExample,
    };
  });
}

const cases = checkCases(casesData);

// 전체 사례 목록
export function getCases(): Case[] {
  return cases;
}

// 사례 번호로 사례 하나 찾기 (없으면 undefined)
export function getCaseById(id: string): Case | undefined {
  return cases.find((item) => item.id === id);
}
