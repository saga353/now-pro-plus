"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration, showExpPopup, showLevelUpPopup } from '@/lib/gamification';

const categories = {
  Health: { color: '#FF6B00', tasks: ["계단 15층 오르기", "스쿼트 20회", "플랭크 1분"] },
  Business: { color: '#007BFF', tasks: ["목표 1줄 작성", "이메일 1통 회신", "아이디어 3분 스케치"] },
  Study: { color: '#9C27B0', tasks: ["책 3페이지 읽기", "영단어 5개 암기", "뉴스 헤드라인 읽기"] },
  Life: { color: '#00E676', tasks: ["책상 정리", "물 한 잔 마시기", "1분 명상"] },
  Record: { color: '#00E5FF', tasks: [] }
};

export default function ActionView() {
  const [currentCat, setCurrentCat] = useState<keyof typeof categories>('Health');
  const [taskText, setTaskText] = useState('로딩 중...');
  const [inputValue, setInputValue] = useState('');
  const [memoValue, setMemoValue] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { user, totalExp, addExp } = useStore();

  useEffect(() => {
    if (currentCat !== 'Record') {
      const tasks = categories[currentCat].tasks;
      setTaskText(tasks[Math.floor(Math.random() * tasks.length)]);
    }
  }, [currentCat]);

  const handleExecute = () => {
    if (currentCat === 'Record' && !inputValue.trim()) return alert("방금 한 일을 적어주세요!");
    setIsExecuting(true);
    triggerVibration(30);
  };

  const calculateLevel = (exp: number) => {
    let lvl = 1; let current = exp;
    while (lvl < 99) { if (current >= lvl * 20) { current -= lvl * 20; lvl++; } else break; }
    return lvl;
  };

  const handleSave = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    const finalTask = currentCat === 'Record' ? inputValue.trim() : taskText;
    
    // ⭐️ 클라우드 DB에 Action 기록 저장
    await supabase.from('todos').insert([{
      user_id: user.id,
      type: 'Action',
      title: finalTask,
      priority: currentCat, // Action의 카테고리를 저장
      status: '완료',
      remark: memoValue.trim() || '기록 없음',
      granted_exp: 2,
      status_time: new Date().toLocaleString('ko-KR')
    }]);

    // 경험치 및 레벨업 계산
    let oldLevel = calculateLevel(totalExp);
    const newTotalExp = totalExp + 2;
    const newLevel = calculateLevel(newTotalExp);

    if (newLevel > oldLevel) showLevelUpPopup(newLevel);
    else showExpPopup(2);
    
    addExp(2);

    // 폼 초기화
    setIsExecuting(false); setInputValue(''); setMemoValue('');
    if (currentCat !== 'Record') {
      const tasks = categories[currentCat].tasks;
      setTaskText(tasks[Math.floor(Math.random() * tasks.length)]);
    }
  };

  return (
    <div className="flex flex-col items-center pt-2 pb-[120px] px-5">
      <div className="flex overflow-x-auto whitespace-nowrap w-full gap-2 pb-4 scrollbar-hide px-2">
        {Object.entries(categories).map(([cat, data]) => (
          <button
            key={cat} onClick={() => { setCurrentCat(cat as any); setIsExecuting(false); triggerVibration(10); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${currentCat === cat ? 'text-white' : 'bg-[#2a2a2a] text-[#888] border-transparent'}`}
            style={currentCat === cat ? { backgroundColor: data.color, borderColor: data.color } : {}}
          >
            {cat === 'Business' ? 'Biz' : cat}
          </button>
        ))}
      </div>
      <div className="w-full text-right text-[0.65rem] text-[#666] pr-2 -mt-2 mb-4">↔ 터치하여 스크롤</div>

      <div className="w-full bg-[#1e1e1e] border-2 rounded-2xl p-8 text-center transition-colors shadow-lg" style={{ borderColor: categories[currentCat].color }}>
        <div className="font-montserrat text-[#888] text-xl mb-4">Now:[</div>
        
        {!isExecuting ? (
          <>
            {currentCat === 'Record' ? (
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="방금 한 일을 적으세요" className="w-full text-xl font-black text-center bg-transparent border-b-2 border-dashed pb-2 outline-none" style={{ color: categories[currentCat].color, borderColor: categories[currentCat].color }} />
            ) : (
              <div className="text-2xl font-black break-keep leading-tight mb-4" style={{ color: categories[currentCat].color }}>{taskText}</div>
            )}
            <div className="font-montserrat text-[#888] text-xl mt-4 mb-6">]</div>
            <button onClick={handleExecute} className="w-full text-white py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md" style={{ backgroundColor: categories[currentCat].color }}>
              {currentCat === 'Record' ? '입력 완료' : '행동 시작'}
            </button>
          </>
        ) : (
          <div className="animate-fade-swipe">
            <div className="text-xl font-black mb-6" style={{ color: categories[currentCat].color }}>{currentCat === 'Record' ? inputValue : taskText}</div>
            <textarea value={memoValue} onChange={e => setMemoValue(e.target.value)} placeholder="과업 완료! 떠오른 생각을 기록하세요." className="w-full bg-[#111] border border-[#444] rounded-xl text-white p-4 h-28 mb-4 outline-none resize-none" />
            <button onClick={handleSave} className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg transition-transform active:scale-95">
              성과 저장하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}