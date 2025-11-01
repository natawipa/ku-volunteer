"use client";

interface HeroImageProps {
  containerHeight?: string;
  mountainHeight?: string;
}

export default function HeroImage({ containerHeight = "400px", mountainHeight = "330px" }: HeroImageProps) {
  return (
     <div className="absolute inset-0 -z-10">
    <div className={`relative w-full ${containerHeight}`}>
      {/* gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white" 
           style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', height: containerHeight }} />
      {/* mountain background */}
      <div className={`absolute inset-0 top-0 bg-[url('/mountain.svg')] bg-cover bg-center `}
            style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', height: mountainHeight }} />
    </div>
    </div>
  );
}