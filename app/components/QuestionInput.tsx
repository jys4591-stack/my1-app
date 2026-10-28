"use client";

// ④ 입력 줄: 질문 입력창과 보내기 버튼 (DESIGN.md 2절)
// 사진이 1장 이상 있어야 보낼 수 있는 조건은 PLAN 8번(사진 올리기)에서 더합니다.
import { useState, type FormEvent } from "react";

// 질문 길이 제한 (DESIGN.md 5절: 1~500자)
const MAX_QUESTION_LENGTH = 500;

type Props = {
  disabled: boolean; // 보내는 중이면 입력을 막음
  onSend: (question: string) => void;
};

export default function QuestionInput({ disabled, onSend }: Props) {
  const [question, setQuestion] = useState("");
  const trimmed = question.trim();
  const canSend = !disabled && trimmed.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setQuestion("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="question" className="sr-only">
        질문
      </label>
      <input
        id="question"
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        maxLength={MAX_QUESTION_LENGTH}
        placeholder="질문을 입력하세요 (예: 이 상황은 무단점유인가요?)"
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        보내기
      </button>
    </form>
  );
}
