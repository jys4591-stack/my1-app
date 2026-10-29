"use client";

// 글을 클립보드에 복사하는 버튼 (PRD.md nice: 답변 초안 복사 버튼, PLAN 15)
// 복사한 글은 화면에 보이는 그대로입니다. (끝맺음 문구 "※ AI 초안 — 담당자 검토 후 사용"도 포함)
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "copied" | "failed";

// 복사했다는 표시를 보여 주는 시간(밀리초)
const FEEDBACK_MS = 2000;

// 1순위: 최신 방식(navigator.clipboard) — https 주소나 localhost에서만 동작합니다.
// 2순위: 안 되면(예: http로 접속, 권한 거절) 보이지 않는 입력칸을 이용한 예전 방식으로 다시 시도합니다.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 아래 예전 방식으로 이어서 시도
  }

  try {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(box);
    return ok;
  } catch {
    return false;
  }
}

type Props = {
  text: string; // 복사할 글
  label: string; // 화면 낭독기가 읽을 이름 (예: "민원 답변 초안 복사")
};

export default function CopyButton({ text, label }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면에서 사라질 때 남은 타이머를 정리
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleClick() {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  }

  const visibleText =
    status === "copied"
      ? "복사했어요"
      : status === "failed"
        ? "복사 안 됨 · 직접 선택해 주세요"
        : "복사";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="whitespace-nowrap rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {visibleText}
      </button>
      {/* 결과를 화면 낭독기에도 알림 */}
      <span role="status" className="sr-only">
        {status === "copied"
          ? "복사했어요"
          : status === "failed"
            ? "복사하지 못했어요. 글자를 직접 선택해 복사해 주세요."
            : ""}
      </span>
    </>
  );
}
