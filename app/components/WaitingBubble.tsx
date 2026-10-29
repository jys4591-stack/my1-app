"use client";

// AI 답을 기다리는 동안 보여 주는 "분석 중" 표시 (DESIGN.md 2절 ②)
// 돌아가는 표시와 흐른 시간을 보여 줘서, 멈춘 게 아니라 일하는 중임을 알립니다.
import { useEffect, useState } from "react";

// 이 시간(초)이 지나면 안내 문구를 바꿉니다. (실제 응답 시간을 약속하는 말은 쓰지 않습니다)
const SLOW_AFTER_SECONDS = 10;
const VERY_SLOW_AFTER_SECONDS = 40;

export default function WaitingBubble() {
  const [seconds, setSeconds] = useState(0);

  // 이 표시가 화면에 나타난 순간부터 흐른 시간을 셉니다. (기다림이 끝나면 표시가 사라져 자동으로 멈춤)
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const note =
    seconds >= VERY_SLOW_AFTER_SECONDS
      ? "시간이 좀 걸리고 있어요. 조금만 더 기다려 주세요."
      : seconds >= SLOW_AFTER_SECONDS
        ? "사진을 꼼꼼히 보고 있어요. 잠시만 기다려 주세요."
        : null;

  return (
    <div className="flex max-w-[85%] flex-col gap-1 self-start rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      <div className="flex items-center gap-2">
        {/* 돌아가는 표시: 움직임을 줄이는 설정을 켠 사용자에게는 멈춰 있게 함 */}
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent motion-reduce:animate-none dark:border-zinc-500 dark:border-t-transparent"
        />
        <span>분석 중…</span>
        {/* 초가 바뀔 때마다 화면 낭독기가 읽지 않도록 숨김 */}
        <span aria-hidden="true" className="text-xs tabular-nums text-zinc-500">
          {seconds}초
        </span>
      </div>
      {note && <p className="text-xs text-zinc-500 dark:text-zinc-400">{note}</p>}
    </div>
  );
}
