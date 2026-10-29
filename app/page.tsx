"use client";

// 첫 화면: 머리글 · 대화 영역 · 사진 올리기 줄 · 입력 줄을 조립하고 대화 내용을 관리합니다 (DESIGN.md 2절)
// 보내기를 누르면 사진 + 질문을 /api/analyze로 보내고, 받은 답을 대화 영역에 보여 줍니다 (DESIGN.md 3절 ③⑩)
import { useRef, useState } from "react";
import ChatList from "@/app/components/ChatList";
import Header from "@/app/components/Header";
import PhotoPicker from "@/app/components/PhotoPicker";
import QuestionInput from "@/app/components/QuestionInput";
// 주의: 이 파일(브라우저 코드)은 lib/types.ts의 값을 가져오지 않습니다. (zod가 브라우저로 딸려 오는 것을 막으려고)
// 타입만 가져오는 것은 괜찮습니다.
import type { ChatMessage, Classification, PickedPhoto } from "@/lib/types";

const NETWORK_ERROR = "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const nextId = useRef(1);

  function addMessage(message: Omit<ChatMessage, "id">) {
    setMessages((previous) => [
      ...previous,
      { ...message, id: nextId.current++ },
    ]);
  }

  async function handleSend(question: string) {
    // 보낸 사진은 말풍선에서 계속 보여야 하므로 미리보기 주소를 지우지 않고 넘깁니다.
    const sentPhotos = photos;
    addMessage({
      role: "user",
      text: question,
      photoUrls: sentPhotos.map((photo) => photo.previewUrl),
    });
    setPhotos([]);
    setWaiting(true);

    const formData = new FormData();
    formData.append("question", question);
    for (const photo of sentPhotos) {
      formData.append("photos", photo.blob, `${photo.id}.jpg`);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data: { classification?: Classification; error?: string } =
        await response.json().catch(() => ({}));

      if (response.ok && data.classification) {
        // 분류 → 유사 사례 → 초안은 결과 카드(ResultCard)가 구분해서 보여 줍니다
        addMessage({
          role: "assistant",
          text: "분석 결과",
          result: data.classification,
        });
      } else {
        addMessage({
          role: "assistant",
          text: data.error ?? "AI 응답에 문제가 있어요. 잠시 후 다시 시도해 주세요.",
          isError: true,
        });
      }
    } catch {
      addMessage({ role: "assistant", text: NETWORK_ERROR, isError: true });
    } finally {
      setWaiting(false);
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <Header />
      <ChatList messages={messages} waiting={waiting} />
      <PhotoPicker
        photos={photos}
        disabled={waiting}
        onChange={setPhotos}
        onBusyChange={setPhotoBusy}
      />
      <QuestionInput
        disabled={waiting}
        hasPhoto={photos.length > 0}
        photoBusy={photoBusy}
        onSend={handleSend}
      />
    </main>
  );
}
