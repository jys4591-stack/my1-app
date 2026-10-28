// 첫 화면 (PLAN 3: Next.js 예시 내용을 지우고 앱 소개만 남김)
// 대화 영역·사진 올리기·입력 줄은 PLAN 7~8번에서 부품(components)으로 붙입니다.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight">
          국유재산 현장사진 AI 도우미
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          현장사진과 질문을 올리면 상황 분류, 유사 사례, 민원 답변 초안을
          보여 드립니다.
        </p>
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          얼굴·차량 번호판·주소가 보이는 사진은 올리지 마세요.
        </p>
      </header>

      <section className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
        대화 화면을 준비하고 있어요.
      </section>
    </main>
  );
}
