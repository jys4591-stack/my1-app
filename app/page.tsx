"use client";

// 첫 화면: 머리글 · 대화 영역 · 입력 줄을 조립하고 대화 내용을 관리합니다 (DESIGN.md 2절)
// ③ 사진 올리기 줄은 PLAN 8번, 서버로 보내 AI 답을 받는 부분은 PLAN 9번에서 붙입니다.
import { useRef, useState } from "react";
import ChatList from "@/app/components/ChatList";
import Header from "@/app/components/Header";
import QuestionInput from "@/app/components/QuestionInput";
import type { ChatMessage } from "@/lib/types";

// AI 연결 전까지 보여 줄 임시 안내 (PLAN 9번에서 실제 AI 결과로 바꿈)
const PLACEHOLDER_REPLY =
  "아직 AI가 연결되지 않았어요. 사진 올리기와 AI 분석은 다음 단계에서 붙어요.";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextId = useRef(1);

  function handleSend(question: string) {
    setMessages((previous) => [
      ...previous,
      { id: nextId.current++, role: "user", text: question },
      { id: nextId.current++, role: "assistant", text: PLACEHOLDER_REPLY },
    ]);
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Header />
      {/* waiting은 PLAN 9번에서 서버 응답을 기다리는 동안 true가 됩니다 */}
      <ChatList messages={messages} waiting={false} />
      <QuestionInput disabled={false} onSend={handleSend} />
    </main>
  );
}
