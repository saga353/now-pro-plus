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
    <div className="fixed bottom-0 left-0 w-full h-[65px] bg-[#1e1e1e] flex border-t border-[#333] z-[100] pb-safe">
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
            className={`flex-1 flex flex-col items-center justify-center text-[0.65rem] font-bold cursor-pointer transition-colors ${isActive ? item.color : 'text-[#888]'}`}
          >
            <Icon className="w-[1.3rem] h-[1.3rem] mb-1" />
            {item.label}
          </div>
        );
      })}
    </div>
  );
}