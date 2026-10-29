"use client";

// 첫 화면: 머리글 · 대화 영역 · 사진 올리기 줄 · 입력 줄을 조립하고 대화 내용을 관리합니다 (DESIGN.md 2절)
// 보내기를 누르면 사진 + 질문을 /api/analyze로 보내고, 받은 답을 대화 영역에 보여 줍니다 (DESIGN.md 3절 ③⑩)
import { useRef, useState } from "react";
import ChatList from "@/app/components/ChatList";
import Header from "@/app/components/Header";
import PhotoPicker from "@/app/components/PhotoPicker";
import QuestionInput from "@/app/components/QuestionInput";
import { UNSURE_CATEGORY } from "@/lib/types";
import type { ChatMessage, Classification, PickedPhoto } from "@/lib/types";

const NETWORK_ERROR = "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.";

// 분류 결과를 말풍선 글로 바꿉니다. (결과 카드는 PLAN 13번에서 만듭니다)
function formatClassification(result: Classification): string {
  const lines =
    result.category === UNSURE_CATEGORY
      ? [`상황 분류: ${UNSURE_CATEGORY} — 현장 재확인 필요 (확신도 ${result.confidence}%)`]
      : [`상황 분류: ${result.category} (확신도 ${result.confidence}%)`];
  if (result.reason) lines.push(`근거: ${result.reason}`);
  if (result.answer) lines.push(result.answer);

  // 유사 사례: 출처는 사례 번호·제목 (PRD.md 5번). 없으면 "유사 사례 없음"
  if (result.similarCases.length === 0) {
    lines.push("유사 사례 없음");
  } else {
    lines.push("유사 사례");
    for (const item of result.similarCases) {
      lines.push(`- ${item.id} ${item.title}`);
    }
  }

  // 민원 답변 초안 (끝맺음 문구는 서버가 이미 붙여 둠). 업무 밖 요청이면 초안이 없음
  if (result.replyDraft) {
    lines.push("", "민원 답변 초안", result.replyDraft);
  }
  return lines.join("\n");
}

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
        addMessage({
          role: "assistant",
          text: formatClassification(data.classification),
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
