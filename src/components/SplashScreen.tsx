'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 2초 동안 보여주고, 0.5초 동안 서서히 사라짐 (총 2.5초)
    const fadeTimer = setTimeout(() => setIsFading(true), 2000);
    const removeTimer = setTimeout(() => onFinish(), 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
    // ⭐️ 부모 화면이 업데이트되어도 타이머가 리셋되지 않도록 빈 배열로 고정!
  }, []); 

  return (
    <>
      <style>{`
        @keyframes fillBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-fill {
          animation: fillBar 2s ease-in-out forwards;
        }
      `}</style>
      
      <div 
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#121212] transition-opacity duration-500 ${
          isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="mb-4">
  {/* public 폴더에 넣은 파일 이름을 / 와 함께 적어줍니다 */}
<img 
  src="/m-logo.png" 
  alt="Now Logo" 
  className="w-auto h-auto max-w-[80vw] max-h-[45vh] md:max-h-[55vh] object-contain animate-pulse rounded-2xl shadow-2xl" 
/>
</div>
        
        <p className="text-[#888888] text-sm tracking-widest font-medium mb-12 select-none">
          Think Big, Act Small, Move Now.
        </p>

        <div className="w-48 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] animate-fill rounded-full"></div>
        </div>
      </div>
    </>
  );
}