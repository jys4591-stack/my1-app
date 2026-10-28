"use client";

// ③ 사진 올리기 줄: 검사 → 줄이기 → 미리보기 (DESIGN.md 2절 ③, 3절 ①②)
import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import type { PickedPhoto } from "@/lib/types";

// 사진 규칙 (PRD.md 5번 must ①: 최대 3장, 장당 10MB 이하 / DESIGN.md 7절: JPG·PNG만)
export const MAX_PHOTOS = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

// 보내기 전에 줄일 크기 (DESIGN.md 3절 ②: 긴 변 1568px, JPG)
// Vercel이 한 번에 받는 용량(약 4.5MB)을 넘지 않게 하려는 것입니다.
const MAX_SIDE_PX = 1568;
const JPEG_QUALITY = 0.85;

// 사진을 긴 변 1568px 이하의 JPG로 줄입니다. (작은 사진은 크기는 그대로, JPG로만 바꿈)
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image", // 휴대폰 사진의 회전 정보를 반영
  });
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas를 쓸 수 없어요.");
  context.fillStyle = "#ffffff"; // PNG의 투명한 부분은 흰색으로
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("사진 변환 실패"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

type Props = {
  photos: PickedPhoto[];
  disabled: boolean; // 보내는 중이면 막음
  onChange: (photos: PickedPhoto[]) => void;
  onBusyChange: (busy: boolean) => void; // 사진을 줄이는 동안 보내기를 막기 위해
};

export default function PhotoPicker({
  photos,
  disabled,
  onChange,
  onBusyChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const isFull = photos.length >= MAX_PHOTOS;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // 같은 파일을 다시 골라도 동작하도록 비움
    if (files.length === 0) return;

    const newErrors: string[] = [];
    const accepted: File[] = [];
    let room = MAX_PHOTOS - photos.length;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`${file.name}: JPG·PNG 사진만 올릴 수 있어요.`);
      } else if (file.size > MAX_FILE_BYTES) {
        newErrors.push(`${file.name}: 10MB 이하 사진만 올릴 수 있어요.`);
      } else if (room <= 0) {
        newErrors.push(`${file.name}: 사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
      } else {
        accepted.push(file);
        room -= 1;
      }
    }

    setBusy(true);
    onBusyChange(true);
    const added: PickedPhoto[] = [];
    for (const file of accepted) {
      try {
        const blob = await shrinkPhoto(file);
        added.push({
          id: nextId.current++,
          name: file.name,
          blob,
          previewUrl: URL.createObjectURL(blob),
        });
      } catch {
        newErrors.push(`${file.name}: 사진을 읽을 수 없어요. 다른 사진으로 시도해 주세요.`);
      }
    }
    setBusy(false);
    onBusyChange(false);

    setErrors(newErrors);
    if (added.length > 0) onChange([...photos, ...added]);
  }

  function removePhoto(id: number) {
    const target = photos.find((photo) => photo.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((photo) => photo.id !== id));
    setErrors([]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || isFull}
          className="h-16 rounded-lg border border-dashed border-zinc-400 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600"
        >
          + 사진 추가
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleFiles}
          className="hidden"
          aria-label="현장사진 선택"
        />

        {photos.map((photo) => (
          <div key={photo.id} className="relative h-16 w-16">
            <Image
              src={photo.previewUrl}
              alt={`선택한 사진: ${photo.name}`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              disabled={disabled}
              aria-label={`${photo.name} 빼기`}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              ×
            </button>
          </div>
        ))}

        {busy && <span className="text-sm text-zinc-500">사진 준비 중…</span>}
      </div>

      <p className="text-xs text-zinc-500">
        최대 {MAX_PHOTOS}장, 장당 10MB 이하 (JPG·PNG) · {photos.length}/{MAX_PHOTOS}
      </p>

      {errors.length > 0 && (
        <ul role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
