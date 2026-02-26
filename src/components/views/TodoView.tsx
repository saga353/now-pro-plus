"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration, showExpPopup, showJackpotPopup, showLevelUpPopup } from '@/lib/gamification';

export default function TodoView() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [remark, setRemark] = useState('');
  const [priority, setPriority] = useState('보스레이드');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [todos, setTodos] = useState<any[]>([]);
  const [activeEditId, setActiveEditId] = useState<string | null>(null); // 상태 설정창 열림/닫힘 제어

  const { user, totalExp, addExp } = useStore();

  const questTypes = [
    { id: '보스레이드', icon: '🔥', color: '#FF5252' },
    { id: '스킬레벨업', icon: '⚡', color: '#2196F3' },
    { id: '서브퀘스트', icon: '📜', color: '#4CAF50' },
    { id: '시간 낭비', icon: '🎲', color: '#9C27B0' },
  ];

  // 1. 할 일 불러오기 (최신순)
  const fetchTodos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'Todo') // Todo 타입만 가져오기
      .order('created_at', { ascending: false });
    
    if (!error && data) setTodos(data);
  };

  useEffect(() => {
    fetchTodos();
  }, [user]);

  // 2. 새로운 할 일 등록 (DB 확장된 칼럼 반영)
  const handleAddTodo = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!title.trim()) return alert("해야할 일을 입력하세요.");
    
    setIsSubmitting(true);
    triggerVibration(10);

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{ 
            user_id: user.id,
            type: 'Todo', // 👈 유형 구분
            title: title.trim(),
            priority: priority,
            status: '등록',
            deadline_at: date ? new Date(date).toISOString() : null,
            remark: remark.trim() || '내용 없음',
            granted_exp: 0 // 👈 획득 경험치 초기값
        }]);

      if (error) throw error;
      
      triggerVibration([20, 50, 20]);
      setTitle(''); setDate(''); setRemark('');
      fetchTodos();
    } catch (err: any) {
      alert("저장 실패: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 레벨 계산 헬퍼 함수
  const calculateLevel = (exp: number) => {
    let lvl = 1; let current = exp;
    while (lvl < 99) {
      let needed = lvl * 20;
      if (current >= needed) { current -= needed; lvl++; } 
      else break;
    }
    return lvl;
  };

  // 4. 상태 업데이트 & ⭐️ 도파민 보상 엔진 발동
  const updateStatus = async (todo: any, newStatus: string) => {
    triggerVibration(10);
    
    let earnedExp = 0;
    let gamificationTriggered = false;
    let oldLevel = calculateLevel(totalExp);

    // '완료'로 상태가 바뀔 때만 경험치 계산 및 보상 발동
    if (todo.status !== '완료' && newStatus === '완료') {
      if (todo.priority === '보스레이드') earnedExp = 10;
      else if (todo.priority === '스킬레벨업') earnedExp = 5;
      else if (todo.priority === '서브퀘스트') earnedExp = 3;
      else if (todo.priority === '시간 낭비') earnedExp = Math.floor(Math.random() * 20) + 1; // 1~20 랜덤 잭팟!

      const newTotalExp = totalExp + earnedExp;
      const newLevel = calculateLevel(newTotalExp);

      // 보상 연출 분기 처리
      if (newLevel > oldLevel) {
        showLevelUpPopup(newLevel);
      } else if (todo.priority === '시간 낭비' && earnedExp >= 10) {
        showJackpotPopup(earnedExp); // 🎰 대박 잭팟 터짐!
      } else {
        showExpPopup(earnedExp); // 일반 보상
      }
      
      addExp(earnedExp); // 전역 경험치 업데이트
      gamificationTriggered = true;
    }

    const nowStr = new Date().toLocaleString('ko-KR');

    // DB 업데이트
    const { error } = await supabase
      .from('todos')
      .update({ 
        status: newStatus, 
        status_time: nowStr,
        granted_exp: earnedExp
      })
      .eq('id', todo.id);

    if (!error) {
      setActiveEditId(null); // 설정창 닫기
      fetchTodos(); // 리스트 갱신
    }
  };

  // 5. 기한 임박 경고 뱃지 렌더링 함수
  const getDeadlineWarning = (dateStr: string) => {
    if (!dateStr) return null;
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-red-500 text-white animate-pulse">⚠️ 기한 지남</span>;
    if (diffHours <= 1) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-orange-500 text-black">⏳ 1시간 전</span>;
    if (diffHours <= 24) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-yellow-400 text-black">⏰ 1일 전</span>;
    return null;
  };

  return (
    <div className="flex flex-col items-center pt-2 pb-[120px] px-5">
      {/* 폼 영역 (기존과 동일) */}
      <div className="w-full bg-[#1e1e1e] p-4 rounded-2xl mb-5 border-l-4 border-[#9C27B0] shadow-lg">
        <input 
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="새로운 해야할 일 (Task)"
          className="w-full bg-[#111] border border-[#333] rounded-xl text-white p-4 text-base mb-3 outline-none focus:border-[#9C27B0] transition-colors"
        />
        
        <div className="text-[0.8rem] text-[#888] font-bold mb-2 ml-1">퀘스트 등급 (완료 시 EXP 획득)</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {questTypes.map(q => (
            <button
              key={q.id}
              onClick={() => { setPriority(q.id); triggerVibration(10); }}
              className={`p-3 rounded-xl text-[0.8rem] font-bold transition-all border ${priority === q.id ? 'text-white shadow-md transform scale-105' : 'bg-[#222] text-[#aaa] border-[#444]'}`}
              style={priority === q.id ? { backgroundColor: q.color, borderColor: q.color } : {}}
            >
              {q.icon} {q.id}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1 mb-3">
          <span className="text-[0.8rem] text-[#888] font-bold ml-1">기한 (시:분:초)</span>
          <input 
            type="datetime-local" step="1"
            value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-xl text-white p-4 text-base outline-none focus:border-[#9C27B0] color-scheme-dark transition-colors"
          />
        </div>

        <input 
          type="text" value={remark} onChange={(e) => setRemark(e.target.value)}
          placeholder="초기 메모 (세부사항 등)"
          className="w-full bg-[#111] border border-[#333] rounded-xl text-white p-4 text-base mb-3 outline-none focus:border-[#9C27B0] transition-colors"
        />

        <button 
          onClick={handleAddTodo} disabled={isSubmitting}
          className="w-full bg-[#9C27B0] hover:bg-[#8E24AA] text-white py-4 text-base font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '+ 할일 등록'}
        </button>
      </div>

      {/* 할일 리스트 영역 */}
      <div className="w-full flex flex-col gap-4">
        <h3 className="text-xl font-bold text-[#9C27B0] ml-1">🔥 진행 중인 퀘스트</h3>
        {todos.filter(t => t.status !== '완료' && t.status !== '폐기').length === 0 ? (
          <div className="text-center text-[#555] py-10 bg-[#1e1e1e] rounded-2xl text-sm">등록된 할일이 없습니다.</div>
        ) : (
          todos.map(todo => {
            if (todo.status === '완료' || todo.status === '폐기') return null; // 활성 뷰에선 숨김
            
            const qType = questTypes.find(q => q.id === todo.priority) || questTypes[2];
            const isEditing = activeEditId === todo.id;
            
            // 상태별 색상
            let statusColor = '#00BCD4'; // 등록
            if (todo.status === '진행중') statusColor = '#007BFF';
            if (todo.status === '보류') statusColor = '#FF9800';

            return (
              <div key={todo.id} className="bg-[#1a1a1a] border-l-4 rounded-xl p-4 transition-all" style={{ borderLeftColor: qType.color }}>
                {/* 1. 타이틀 및 뱃지 */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[0.65rem] px-2 py-1 rounded-md font-bold whitespace-nowrap mt-1" style={{ backgroundColor: qType.color, color: 'white' }}>
                    {qType.icon} {todo.priority}
                  </span>
                  <span className="font-bold text-[#eee] text-lg leading-tight break-keep">{todo.title}</span>
                </div>
                
                {/* 2. 메타 정보 (기한, 메모) */}
                <div className="flex flex-col gap-1 mb-3">
                  <div className="text-[0.8rem] text-[#aaa]">
                    📅 기한: {todo.deadline_at ? new Date(todo.deadline_at).toLocaleString('ko-KR') : '기한 미정'}
                    {getDeadlineWarning(todo.deadline_at)}
                  </div>
                  {todo.remark && todo.remark !== '내용 없음' && (
                    <div className="text-[0.85rem] text-[#ccc] bg-[#333] p-3 rounded-lg mt-1 leading-relaxed">
                      📝 {todo.remark}
                    </div>
                  )}
                </div>

                {/* 3. 상태 표시 및 설정 버튼 */}
                <div className="flex justify-between items-center bg-[#222] p-2 px-3 rounded-lg border border-[#333]">
                  <div className="text-[0.85rem] font-bold" style={{ color: statusColor }}>
                    ● {todo.status} {todo.status_time && <span className="text-[#666] font-normal text-xs ml-1">({todo.status_time})</span>}
                  </div>
                  <button 
                    onClick={() => setActiveEditId(isEditing ? null : todo.id)}
                    className="text-[0.75rem] text-[#aaa] border border-[#555] px-3 py-1 rounded-full hover:bg-[#333] transition-colors"
                  >
                    ⚙️ 상태 변경
                  </button>
                </div>

                {/* 4. 상태 변경 아코디언 메뉴 */}
                {isEditing && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed border-[#444] animate-fade-swipe">
                    <button onClick={() => updateStatus(todo, '진행중')} className="py-2 bg-[#007BFF]20 text-[#007BFF] border border-[#007BFF] rounded-lg text-sm font-bold active:scale-95 transition-transform">🚀 진행중</button>
                    <button onClick={() => updateStatus(todo, '보류')} className="py-2 bg-[#FF9800]20 text-[#FF9800] border border-[#FF9800] rounded-lg text-sm font-bold active:scale-95 transition-transform">⏸️ 보류</button>
                    <button onClick={() => updateStatus(todo, '폐기')} className="py-2 bg-[#F44336]20 text-[#F44336] border border-[#F44336] rounded-lg text-sm font-bold active:scale-95 transition-transform">🗑️ 폐기</button>
                    <button onClick={() => updateStatus(todo, '완료')} className="py-2 bg-[#00E676] text-black rounded-lg text-sm font-black active:scale-95 transition-transform shadow-[0_0_10px_rgba(0,230,118,0.5)]">✅ 완료 (보상 획득)</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}