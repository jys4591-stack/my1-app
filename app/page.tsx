"use client";

// 첫 화면: 머리글 · 대화 영역 · 사진 올리기 줄 · 입력 줄을 조립하고 대화 내용을 관리합니다 (DESIGN.md 2절)
// 서버로 보내 AI 답을 받는 부분은 PLAN 9번에서 붙입니다.
import { useRef, useState } from "react";
import ChatList from "@/app/components/ChatList";
import Header from "@/app/components/Header";
import PhotoPicker from "@/app/components/PhotoPicker";
import QuestionInput from "@/app/components/QuestionInput";
import type { ChatMessage, PickedPhoto } from "@/lib/types";

// AI 연결 전까지 보여 줄 임시 안내 (PLAN 9번에서 실제 AI 결과로 바꿈)
const PLACEHOLDER_REPLY =
  "아직 AI가 연결되지 않았어요. 사진과 질문을 서버로 보내 분석하는 부분은 다음 단계에서 붙어요.";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const nextId = useRef(1);

  function handleSend(question: string) {
    // 보낸 사진은 말풍선에서 계속 보여야 하므로 미리보기 주소를 지우지 않고 넘깁니다.
    const photoUrls = photos.map((photo) => photo.previewUrl);
    setMessages((previous) => [
      ...previous,
      { id: nextId.current++, role: "user", text: question, photoUrls },
      { id: nextId.current++, role: "assistant", text: PLACEHOLDER_REPLY },
    ]);
    setPhotos([]);
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Header />
      {/* waiting은 PLAN 9번에서 서버 응답을 기다리는 동안 true가 됩니다 */}
      <ChatList messages={messages} waiting={false} />
      <PhotoPicker
        photos={photos}
        disabled={false}
        onChange={setPhotos}
        onBusyChange={setPhotoBusy}
      />
      <QuestionInput
        disabled={false}
        hasPhoto={photos.length > 0}
        photoBusy={photoBusy}
        onSend={handleSend}
      />
    </main>
  );
}
