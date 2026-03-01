"use client";
import { useStore } from '@/store/useStore';
import { Zap, CheckSquare, CalendarDays, Archive, BarChart3 } from 'lucide-react'; // 모던 아이콘

export default function BottomNav() {
  const { currentTab, setCurrentTab } = useStore();

  const navItems = [
    { id: 'action', icon: Zap, label: 'ACTION', color: 'text-[#FF6B00]' },
    { id: 'todo', icon: CheckSquare, label: 'TODO', color: 'text-[#9C27B0]' },
    { id: 'calendar', icon: CalendarDays, label: 'CALENDAR', color: 'text-[#2196F3]' },
    { id: 'history', icon: Archive, label: 'HISTORY', color: 'text-[#107C41]' },
    { id: 'dashboard', icon: BarChart3, label: 'DASH', color: 'text-[#00E676]' },
  ];

  return (
    // ⭐️ 배경: bg-[var(--card-bg)], 테두리: border-gray-200 dark:border-[#333] 적용
    <div className="fixed bottom-0 left-0 w-full h-[65px] bg-[var(--card-bg)] flex border-t border-gray-200 dark:border-[#333] z-[100] pb-safe transition-colors duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        
        return (
          <div 
            key={item.id}
            onClick={() => {
              setCurrentTab(item.id);
              if(navigator.vibrate) navigator.vibrate(10);
            }}
            // ⭐️ 비활성화 아이콘 색상: text-[var(--sub-text)] 적용
            className={`flex-1 flex flex-col items-center justify-center text-[0.65rem] font-bold cursor-pointer transition-colors duration-300 ${isActive ? item.color : 'text-[var(--sub-text)]'}`}
          >
            <Icon className="w-[1.3rem] h-[1.3rem] mb-1" />
            {item.label}
          </div>
        );
      })}
    </div>
  );
}