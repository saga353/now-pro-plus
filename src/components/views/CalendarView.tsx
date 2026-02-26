"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration } from '@/lib/gamification';

// ⭐️ 절대 무적 시간 변환기: 어떤 형태의 날짜가 와도 KST 기준으로 정확히 YYYY-MM-DD만 뽑아냅니다.
const getLocalDateStr = (dateVal: any) => {
  if (!dateVal) return "";
  try {
    let safeDate = typeof dateVal === 'string' ? dateVal.replace(' ', 'T') : dateVal;
    const d = new Date(safeDate);
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch(e) {
    return "";
  }
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<any[]>([]);
  const { user } = useStore();

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
        setTodos(data);
      }
    };
    fetchAll();
  }, [user]);

  const changeMonth = (diff: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + diff);
    setCurrentDate(newDate);
    triggerVibration(10);
  };

  // 달력 렌더링 계산
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const todayStr = getLocalDateStr(new Date());
  const selDateStr = getLocalDateStr(selectedDate);

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 선택된 날짜의 일정 필터링
  const selectedDayTasks = todos.filter(t => {
    if (t.status === '완료' || t.status === '폐기') return false;
    return getLocalDateStr(t.deadline_at) === selDateStr;
  });

  return (
    <div className="flex flex-col items-center pt-2 pb-[120px]">
      <div className="w-[90%] max-w-[450px] bg-[#1e1e1e] border-t-4 border-[#2196F3] rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <button onClick={() => changeMonth(-1)} className="text-xl p-2 font-bold text-[#888] hover:text-[#2196F3] transition-colors">◀</button>
          <h2 className="text-2xl font-black font-montserrat text-[#2196F3] tracking-widest">{year}. {String(month + 1).padStart(2, '0')}</h2>
          <button onClick={() => changeMonth(1)} className="text-xl p-2 font-bold text-[#888] hover:text-[#2196F3] transition-colors">▶</button>
        </div>
        
        <div className="grid grid-cols-7 text-center text-[#888] text-xs font-bold mb-3">
          <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1.5">
          {blanks.map(b => <div key={`blank-${b}`} />)}
          {days.map(d => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selDateStr;
            
            // ⭐️ 해당 날짜에 진행/보류 중인 일정이 있는지 체크
            const hasTask = todos.some(t => {
              if (!t.deadline_at || t.status === '완료' || t.status === '폐기') return false;
              return getLocalDateStr(t.deadline_at) === dateStr;
            });

            return (
              <div 
                key={d} 
                onClick={() => { setSelectedDate(new Date(year, month, d)); triggerVibration(10); }}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-all font-bold
                  ${isSelected ? 'bg-[#2196F3] text-white shadow-md scale-105' : 'bg-[#2a2a2a] text-[#ddd] hover:bg-[#3a3a3a]'}
                  ${isToday && !isSelected ? 'border-2 border-[#2196F3] text-[#2196F3]' : ''}
                `}
              >
                <span>{d}</span>
                {/* ⭐️ 위치 이탈 방지: 절대위치(absolute)를 풀고 Flex flow에 맡겨서 무조건 글씨 밑에 나오게 박아버림 */}
                {hasTask ? (
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#FF6B00', borderRadius: '50%', marginTop: '4px', boxShadow: '0 0 5px rgba(255,107,0,0.8)' }}></div>
                ) : (
                  <div style={{ width: '6px', height: '6px', marginTop: '4px' }}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full px-6 animate-fade-swipe">
        <h3 className="text-lg font-bold text-[#2196F3] mb-4 border-b border-[#333] pb-2">
          {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 스케줄
        </h3>
        
        <div className="flex flex-col gap-3">
          {selectedDayTasks.length === 0 ? (
            <div className="text-center text-[#666] py-10 text-sm bg-[#1a1a1a] rounded-xl border border-[#222]">해당 날짜에 기한이 있는 일정이 없습니다.</div>
          ) : (
            selectedDayTasks.map(t => {
              let statusColor = '#00BCD4'; 
              if (t.status === '진행중') statusColor = '#007BFF';
              if (t.status === '보류') statusColor = '#FF9800';

              return (
                <div key={t.id} className="bg-[#1a1a1a] border-l-4 rounded-xl p-4 flex flex-col gap-1 shadow-md transition-all hover:bg-[#222]" style={{ borderLeftColor: statusColor }}>
                  <span className="font-bold text-[#eee] text-lg leading-tight break-keep">{t.title}</span>
                  <span className="text-xs text-[#aaa] mt-1">⏰ {new Date(t.deadline_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[0.7rem] px-2 py-1 bg-[#2a2a2a] w-max rounded-md mt-2 font-bold" style={{ color: statusColor }}>
                    ● {t.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}