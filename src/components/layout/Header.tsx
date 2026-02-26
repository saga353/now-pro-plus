"use client";
import { useStore } from '@/store/useStore';

export default function Header() {
  const { currentTab, totalExp } = useStore();

  // 레벨 연산 로직
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

  return (
    <div className="shrink-0 bg-[#121212] z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] pb-4">
      <div className="p-4 text-center">
        <h1 className={`font-black text-2xl m-0 transition-colors duration-300 ${themeColors[currentTab]}`}>
          {titles[currentTab]}
        </h1>
        <div className="w-[90%] max-w-[400px] mx-auto mt-2 text-center">
          <div className="text-[0.8rem] font-bold text-[#ddd] mb-1 font-sans">
            {level >= 99 ? 'LV.MAX' : `LV.${level} (${exp} / ${nextExp} EXP)`}
          </div>
          <div className="bg-[#333] w-full h-3 rounded-full overflow-hidden border border-[#444]">
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