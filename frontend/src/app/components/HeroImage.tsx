"use client";


export default function HeroImage() {
  return (
     <div className="absolute inset-0 -z-10">
    <div className="relative w-full h-[400px]">
      {/* gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white" 
           style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)' }} />
      {/* mountain background */}
      <div className="absolute inset-0 top-0 bg-[url('/mountain.svg')] bg-cover bg-center"
            style={{ width: '100vw', left: '50%', transform: 'translateX(-50%)', height: '330px' }} />    
    </div>
    </div>
  );
}