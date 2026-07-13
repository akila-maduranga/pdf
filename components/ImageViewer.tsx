'use client';

type Props = {
  shareId: string;
  alt: string;
};

export default function ImageViewer({ shareId, alt }: Props) {
  return (
    <div className="no-select flex items-center justify-center overflow-auto rounded border border-line/15 bg-black/20 p-2 sm:p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/image-stream/${shareId}`}
        alt={alt}
        draggable={false}
        className="max-h-[75vh] max-w-full select-none object-contain shadow-lg"
      />
    </div>
  );
}
