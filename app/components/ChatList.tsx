"use client";

// ② 대화 영역: 주고받은 말풍선과 결과 카드를 위에서 아래로 쌓아 보여 줍니다 (DESIGN.md 2절)
import Image from "next/image";
import { useEffect, useRef } from "react";
import ResultCard from "@/app/components/ResultCard";
import type { ChatMessage } from "@/lib/types";

type Props = {
  messages: ChatMessage[];
  waiting: boolean; // AI 답을 기다리는 중이면 "분석 중…" 표시
};

export default function ChatList({ messages, waiting }: Props) {
  const listRef = useRef<HTMLElement>(null);

  // 새 내용이 생기면 대화 영역 안에서만 스크롤합니다. (페이지 전체가 끌려 내려가지 않게)
  // - 결과 카드가 새로 생기면 카드의 맨 위(상황 분류)가 보이게 합니다. 카드가 길어도 첫 줄부터 읽을 수 있어요.
  // - 그 밖에는 맨 아래로 내립니다.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const lastMessage = messages[messages.length - 1];
    if (!waiting && lastMessage?.result) {
      const cards = list.querySelectorAll<HTMLElement>(":scope > article");
      const card = cards[cards.length - 1];
      if (card) {
        list.scrollTo({ top: Math.max(0, card.offsetTop - 8), behavior: "smooth" });
        return;
      }
    }
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, waiting]);

  if (messages.length === 0 && !waiting) {
    return (
      <section className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
        사진과 질문을 보내면 여기에 결과가 나와요.
      </section>
    );
  }

  return (
    // relative: 화면 낭독용 숨은 글자(sr-only)가 이 영역 밖으로 삐져나가 페이지를 늘리지 않게 합니다.
    <section
      ref={listRef}
      aria-live="polite"
      className="relative flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      {messages.map((message) =>
        message.result ? (
          <ResultCard key={message.id} result={message.result} />
        ) : (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : message.isError
                  ? "max-w-[85%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-red-50 px-4 py-2 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "max-w-[85%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            }
          >
            <span className="sr-only">
              {message.role === "user" ? "나: " : "AI: "}
            </span>
            {message.photoUrls && message.photoUrls.length > 0 && (
              <div className="mb-2 flex gap-1.5">
                {message.photoUrls.map((url, index) => (
                  <Image
                    key={url}
                    src={url}
                    alt={`보낸 사진 ${index + 1}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
            {message.text}
          </div>
        ),
      )}
      {waiting && (
        <div className="self-start rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          분석 중…
        </div>
      )}
    </section>
  );
}
