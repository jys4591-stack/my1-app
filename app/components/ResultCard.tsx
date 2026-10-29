// ② 안의 결과 카드: 상황 분류 → 유사 사례 → 민원 답변 초안을 구분해서 보여 줍니다 (DESIGN.md 2절, PLAN 13)
// 모든 글은 글자 그대로만 보여 줍니다. (마크다운·HTML로 바꾸지 않습니다: XSS 대비)
import CopyButton from "@/app/components/CopyButton";
import { UNSURE_CATEGORY } from "@/lib/constants";
import type { Classification } from "@/lib/types";

type Props = {
  result: Classification;
};

export default function ResultCard({ result }: Props) {
  const isUnsure = result.category === UNSURE_CATEGORY;

  return (
    <article
      aria-label="분석 결과"
      className="flex w-full max-w-[95%] flex-col gap-4 self-start rounded-2xl rounded-bl-sm border border-zinc-200 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {/* 1. 상황 분류 */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-zinc-500">상황 분류</h3>
        {isUnsure ? (
          <div
            role="status"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
          >
            <p className="font-semibold">판단 어려움 — 현장 재확인 필요</p>
            <p className="text-sm">확신도 {result.confidence}%</p>
          </div>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-semibold">{result.category}</span>
            <span className="text-sm text-zinc-500">
              확신도 {result.confidence}%
            </span>
          </p>
        )}
        {result.reason && (
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">근거: </span>
            {result.reason}
          </p>
        )}
        {result.answer && (
          <p className="whitespace-pre-wrap text-sm">{result.answer}</p>
        )}
      </section>

      {/* 2. 유사 사례: 출처는 사례 번호·제목 (PRD.md 5번) */}
      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <h3 className="text-xs font-semibold text-zinc-500">유사 사례</h3>
        {result.similarCases.length === 0 ? (
          <p className="text-sm text-zinc-500">유사 사례 없음</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {result.similarCases.map((item) => (
              <li key={item.id} className="flex gap-2">
                <span className="shrink-0 rounded bg-zinc-100 px-1.5 font-mono text-xs leading-5 dark:bg-zinc-800">
                  {item.id}
                </span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. 민원 답변 초안: 끝맺음 문구는 서버가 이미 붙여 둠. 업무 밖 요청이면 초안이 없음 */}
      {result.replyDraft && (
        <section className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-zinc-500">민원 답변 초안</h3>
            <CopyButton text={result.replyDraft} label="민원 답변 초안 복사" />
          </div>
          <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-6 dark:bg-zinc-800">
            {result.replyDraft}
          </p>
          {result.replyWarnings.map((warning) => (
            <p
              key={warning}
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
            >
              <span aria-hidden="true">⚠ </span>
              <span className="font-medium">확인 필요: </span>
              {warning}
            </p>
          ))}
        </section>
      )}
    </article>
  );
}
