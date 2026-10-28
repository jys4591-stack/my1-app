// ① 머리글: 앱 이름과 개인정보 주의 문구 (DESIGN.md 2절)
export default function Header() {
  return (
    <header className="flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <h1 className="text-2xl font-semibold tracking-tight">
        국유재산 현장사진 AI 도우미
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        현장사진과 질문을 올리면 상황 분류, 유사 사례, 민원 답변 초안을 보여
        드립니다.
      </p>
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        얼굴·차량 번호판·주소가 보이는 사진은 올리지 마세요.
      </p>
    </header>
  );
}
