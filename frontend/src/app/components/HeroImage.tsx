"use client";

interface HeroImageProps {
  containerHeight?: string;
  mountainHeight?: string;
  zIndexClass?: string;
}

export default function HeroImage({
  containerHeight = "400px",
  mountainHeight = "330px",
  zIndexClass = "-z-10",
}: HeroImageProps) {
  return (
    <div className={`absolute inset-0 ${zIndexClass}`}>
      <div className={`relative w-full ${containerHeight}`}>
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white"
          style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', height: containerHeight }}
        />
        <div
          className={`absolute inset-0 top-0 bg-[url('/mountain.svg')] bg-cover bg-center `}
          style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', height: mountainHeight }}
        />
      </div>
    </div>
  );
}