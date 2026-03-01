"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function Header() {
  const { currentTab, totalExp } = useStore();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  let level = 1;
  let exp = totalExp;
  while (level < 99) {
    let needed = level * 20;
    if (exp >= needed) {
      exp -= needed;
      level++;
    } else break;
  }
  const nextExp = level * 20;
  const expPercent = level >= 99 ? 100 : (exp / nextExp) * 100;

  const titles: Record<string, string> = {
    action: 'Now:[ Action ]', todo: 'Now:[ To-Do ]', calendar: 'Now:[ Calendar ]',
    history: 'Now:[ History ]', dashboard: 'Now:[ Dashboard ]',
  };

  const themeColors: Record<string, string> = {
    action: 'text-[#FF6B00]', todo: 'text-[#9C27B0]', calendar: 'text-[#2196F3]',
    history: 'text-[#107C41]', dashboard: 'text-[#00E676]',
  };

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    // ⭐️ 헤더 배경을 bg-[var(--bg-color)]로 변경
    <div className="shrink-0 bg-[var(--bg-color)] z-10 shadow-sm pb-4 w-full flex justify-center transition-colors duration-300 border-b border-[#333]">
      <div className="w-full max-w-[500px] p-4 text-center mt-2 flex flex-col items-center">
        
        <h1 className={`font-black text-2xl m-0 transition-colors duration-300 ${themeColors[currentTab]}`}>
          {titles[currentTab]}
        </h1>
        
        <div className="w-[90%] mx-auto mt-4">
          
          <div className="flex justify-between items-end mb-1">
            {/* ⭐️ 레벨 텍스트 색상을 text-[var(--text-color)]로 변경 */}
            <div className="text-[0.85rem] font-bold text-[var(--text-color)] font-sans transition-colors duration-300">
              {level >= 99 ? 'LV.MAX' : `LV.${level} (${exp} / ${nextExp} EXP)`}
            </div>
            
            {/* ⭐️ 토글 버튼 배경을 bg-[var(--card-bg)]로 변경 */}
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center bg-[var(--card-bg)] text-[var(--text-color)] rounded-full hover:opacity-80 transition-all active:scale-95 text-sm shadow-md border border-[#444]"
              title="테마 변경"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>

          {/* ⭐️ 경험치 바 껍데기 배경을 bg-[var(--card-bg)]로 변경 */}
          <div className="bg-[var(--card-bg)] w-full h-3 rounded-full overflow-hidden border border-[#444] transition-colors duration-300">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFD54F] transition-all duration-500 ease-out"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}