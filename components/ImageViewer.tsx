'use client';

type Props = {
  shareId: string;
  alt: string;
};

export default function ImageViewer({ shareId, alt }: Props) {
  return (
    <div className="no-select flex w-full items-center justify-center overflow-auto rounded-lg border border-line/15 bg-black/20 p-1 sm:p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/image-stream/${shareId}`}
        alt={alt}
        draggable={false}
        className="max-h-[60vh] w-full max-w-full select-none object-contain shadow-lg sm:max-h-[75vh]"
      />
    </div>
  );
}