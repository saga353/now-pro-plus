"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration, showExpPopup, showJackpotPopup, showLevelUpPopup } from '@/lib/gamification';
import ProofOfWorkModal from '@/components/ProofOfWorkModal';
import AARModal from '@/components/AARModal';

export default function TodoView() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [remark, setRemark] = useState('');
  const [priority, setPriority] = useState('보스레이드');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [todos, setTodos] = useState<any[]>([]);
  const [activeEditId, setActiveEditId] = useState<string | null>(null); 

  const { user, totalExp, addExp } = useStore();

  const [isProofOpen, setIsProofOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any>(null);
  
  const [isAAROpen, setIsAAROpen] = useState(false);
  const [selectedDiscardTodo, setSelectedDiscardTodo] = useState<any>(null);

  // ⭐️ WBS 대공사 상태 관리
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({}); // 열림/닫힘 상태
  const [activeSubInputId, setActiveSubInputId] = useState<string | null>(null); // 어떤 퀘스트에 하위 퀘스트를 추가 중인지
  const [subTaskTitle, setSubTaskTitle] = useState(''); // 하위 퀘스트 입력 텍스트

  const questTypes = [
    { id: '보스레이드', icon: '🔥', color: '#FF5252' },
    { id: '스킬레벨업', icon: '⚡', color: '#2196F3' },
    { id: '서브퀘스트', icon: '📜', color: '#4CAF50' },
    { id: '시간 낭비', icon: '🎲', color: '#9C27B0' },
  ];

  const fetchTodos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'Todo') 
      .order('created_at', { ascending: false });
    
    if (!error && data) setTodos(data);
  };

  useEffect(() => {
    fetchTodos();
  }, [user]);

  // 메인(루트) 퀘스트 등록
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
            type: 'Todo',
            title: title.trim(),
            priority: priority,
            status: '등록',
            deadline_at: date ? new Date(date).toISOString() : null,
            remark: remark.trim() || '내용 없음',
            granted_exp: 0 
            // parent_id는 생략되므로 null (루트 퀘스트)
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

  // ⭐️ 하위 퀘스트 등록 로직
  const handleAddSubTodo = async (parentId: string) => {
    if (!user) return;
    if (!subTaskTitle.trim()) return alert("하위 퀘스트 내용을 입력하세요.");
    
    triggerVibration(10);
    try {
      const { error } = await supabase
        .from('todos')
        .insert([{ 
            user_id: user.id,
            type: 'Todo',
            title: subTaskTitle.trim(),
            priority: '서브퀘스트', // 하위는 기본 서브퀘스트 등급
            status: '등록',
            parent_id: parentId, // ⭐️ WBS 핵심: 부모 ID 연결!
            remark: '내용 없음',
            granted_exp: 0 
        }]);

      if (error) throw error;
      
      triggerVibration([20, 30]);
      setSubTaskTitle('');
      setActiveSubInputId(null);
      
      // 하위 퀘스트를 추가하면 부모 탭을 자동으로 펼쳐줌
      setExpandedIds(prev => ({ ...prev, [parentId]: true }));
      fetchTodos();
    } catch (err: any) {
      alert("하위 퀘스트 저장 실패: " + err.message);
    }
  };

  const calculateLevel = (exp: number) => {
    let lvl = 1; let current = exp;
    while (lvl < 99) {
      let needed = lvl * 20;
      if (current >= needed) { current -= needed; lvl++; } 
      else break;
    }
    return lvl;
  };

  const updateStatus = async (todo: any, newStatus: string, proofMemo?: string) => {
    triggerVibration(10);
    let earnedExp = 0;
    let oldLevel = calculateLevel(totalExp);

    if (todo.status !== '완료' && newStatus === '완료') {
      if (todo.priority === '보스레이드') earnedExp = 10;
      else if (todo.priority === '스킬레벨업') earnedExp = 5;
      else if (todo.priority === '서브퀘스트') earnedExp = 3;
      else if (todo.priority === '시간 낭비') earnedExp = Math.floor(Math.random() * 20) + 1; 

      const newTotalExp = totalExp + earnedExp;
      const newLevel = calculateLevel(newTotalExp);

      if (newLevel > oldLevel) {
        showLevelUpPopup(newLevel);
      } else if (todo.priority === '시간 낭비' && earnedExp >= 10) {
        showJackpotPopup(earnedExp); 
      } else {
        showExpPopup(earnedExp); 
      }
      addExp(earnedExp); 
    }

    const nowStr = new Date().toLocaleString('ko-KR');
    const updatePayload: any = {
      status: newStatus,
      status_time: nowStr,
      granted_exp: earnedExp
    };

    if (proofMemo) {
      const prefix = newStatus === '완료' ? '[작업 증명]' : '[실패 회고]';
      updatePayload.remark = todo.remark === '내용 없음' 
        ? `${prefix} ${proofMemo}` 
        : `${todo.remark}\n${prefix} ${proofMemo}`;
    }

    const { error } = await supabase
      .from('todos')
      .update(updatePayload)
      .eq('id', todo.id);

    if (!error) {
      setActiveEditId(null); 
      fetchTodos(); 
    }
  };

  const getDeadlineWarning = (dateStr: string) => {
    if (!dateStr) return null;
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-red-500 text-white animate-pulse">⚠️ 지남</span>;
    if (diffHours <= 1) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-orange-500 text-black">⏳ 임박</span>;
    if (diffHours <= 24) return <span className="ml-2 text-[0.65rem] px-2 py-1 rounded-md font-bold bg-yellow-400 text-black">⏰ 1일전</span>;
    return null;
  };

  const handleClickComplete = (todo: any) => { setSelectedTodo(todo); setIsProofOpen(true); };
  const handleConfirmProof = async (memo: string) => { setIsProofOpen(false); if (selectedTodo) await updateStatus(selectedTodo, '완료', memo); };
  const handleClickDiscard = (todo: any) => { setSelectedDiscardTodo(todo); setIsAAROpen(true); };
  const handleConfirmDiscard = async (memo: string) => { setIsAAROpen(false); if (selectedDiscardTodo) await updateStatus(selectedDiscardTodo, '폐기', memo); };

  // ⭐️ 접고 펴기 토글 함수
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    triggerVibration(5);
  };

  // ⭐️ 데이터 분리: 루트 퀘스트와 하위 퀘스트를 분류합니다.
  const rootTodos = todos.filter(t => !t.parent_id && t.status !== '완료' && t.status !== '폐기');
  const getSubTodos = (parentId: string) => todos.filter(t => t.parent_id === parentId && t.status !== '완료' && t.status !== '폐기');

  // ⭐️ 퀘스트 카드 UI를 하나로 통합하여 렌더링하는 만능 함수 (재사용성 극대화)
  const renderTodoCard = (todo: any, isSubtask: boolean = false) => {
    const qType = questTypes.find(q => q.id === todo.priority) || questTypes[2];
    const isEditing = activeEditId === todo.id;
    let statusColor = '#00BCD4'; 
    if (todo.status === '진행중') statusColor = '#007BFF';
    if (todo.status === '보류') statusColor = '#FF9800';

    const subTodos = getSubTodos(todo.id); // 내 밑에 하위 퀘스트가 있는지 확인
    const isExpanded = expandedIds[todo.id];

    return (
      <div key={todo.id} className="w-full">
        {/* 카드 본체 */}
        <div 
          className={`bg-[var(--card-bg)] rounded-xl p-4 transition-all duration-300 shadow-sm ${isSubtask ? 'ml-6 border-l-2 border-dashed mt-2' : 'border-l-4 mt-4'}`} 
          style={{ borderLeftColor: isSubtask ? 'var(--sub-text)' : qType.color }}
        >
          <div className="flex items-start gap-2 mb-2">
            {!isSubtask && (
              <span className="text-[0.65rem] px-2 py-1 rounded-md font-bold whitespace-nowrap mt-1" style={{ backgroundColor: qType.color, color: 'white' }}>
                {qType.icon} {todo.priority}
              </span>
            )}
            {isSubtask && <span className="text-[0.7rem] mt-1">↳</span>}
            <span className={`font-bold text-[var(--text-color)] leading-tight break-keep transition-colors ${isSubtask ? 'text-base' : 'text-lg'}`}>
              {todo.title}
            </span>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="text-[0.8rem] text-[var(--sub-text)] transition-colors">
              📅 기한: {todo.deadline_at ? new Date(todo.deadline_at).toLocaleString('ko-KR') : '기한 미정'} {getDeadlineWarning(todo.deadline_at)}
            </div>
            {todo.remark && todo.remark !== '내용 없음' && (
              <div className="text-[0.85rem] text-[var(--text-color)] bg-[var(--bg-color)] p-3 rounded-lg mt-1 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
                📝 {todo.remark}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center bg-[var(--bg-color)] p-2 px-3 rounded-lg transition-colors duration-300">
            <div className="text-[0.85rem] font-bold" style={{ color: statusColor }}>
              ● {todo.status} {todo.status_time && <span className="text-[var(--sub-text)] font-normal text-xs ml-1 transition-colors">({todo.status_time})</span>}
            </div>
            <button onClick={() => setActiveEditId(isEditing ? null : todo.id)} className="text-[0.75rem] text-[var(--sub-text)] border border-[var(--sub-text)] px-3 py-1 rounded-full hover:opacity-70 transition-colors">
              ⚙️ 상태 변경
            </button>
          </div>

          {/* 상태 변경 메뉴 */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed border-[var(--sub-text)] animate-fade-swipe">
              <button onClick={() => updateStatus(todo, '진행중')} className="py-2 bg-[#007BFF]20 text-[#007BFF] border border-[#007BFF] rounded-lg text-sm font-bold active:scale-95 transition-transform">🚀 진행중</button>
              <button onClick={() => updateStatus(todo, '보류')} className="py-2 bg-[#FF9800]20 text-[#FF9800] border border-[#FF9800] rounded-lg text-sm font-bold active:scale-95 transition-transform">⏸️ 보류</button>
              <button onClick={() => handleClickDiscard(todo)} className="py-2 bg-[#F44336]20 text-[#F44336] border border-[#F44336] rounded-lg text-sm font-bold active:scale-95 transition-transform">🗑️ 폐기</button>
              <button onClick={() => handleClickComplete(todo)} className="py-2 bg-[#00E676] text-black rounded-lg text-sm font-black active:scale-95 transition-transform shadow-[0_0_10px_rgba(0,230,118,0.5)]">✅ 완료 (보상 획득)</button>
            </div>
          )}

          {/* ⭐️ WBS: 하위 퀘스트 접고 펴기 & 추가 버튼 구역 (루트 퀘스트에만 표시) */}
          {!isSubtask && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-[#444] flex gap-2 transition-colors">
              {subTodos.length > 0 && (
                <button 
                  onClick={() => toggleExpand(todo.id)} 
                  className="flex-1 py-2 rounded-lg text-[0.8rem] font-bold bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--sub-text)] transition-colors"
                >
                  {isExpanded ? '🔽 하위 퀘스트 닫기' : `▶️ 하위 퀘스트 보기 (${subTodos.length})`}
                </button>
              )}
              <button 
                onClick={() => setActiveSubInputId(activeSubInputId === todo.id ? null : todo.id)} 
                className="flex-1 py-2 rounded-lg text-[0.8rem] font-bold bg-[#9C27B0]10 text-[#9C27B0] border border-[#9C27B0] transition-colors"
              >
                + 쪼개기 (WBS)
              </button>
            </div>
          )}
        </div>

        {/* ⭐️ 하위 퀘스트 입력 폼 (토글 시 등장) */}
        {!isSubtask && activeSubInputId === todo.id && (
          <div className="ml-6 mt-2 flex gap-2 animate-fade-swipe">
            <input 
              type="text" value={subTaskTitle} onChange={(e) => setSubTaskTitle(e.target.value)}
              placeholder="하위 퀘스트 내용"
              className="flex-1 bg-[var(--bg-color)] border border-gray-300 dark:border-[#444] rounded-lg text-[var(--text-color)] px-3 py-2 text-sm outline-none focus:border-[#9C27B0] transition-colors"
            />
            <button onClick={() => handleAddSubTodo(todo.id)} className="bg-[#9C27B0] text-white px-4 rounded-lg text-sm font-bold shrink-0">추가</button>
          </div>
        )}

        {/* ⭐️ 재귀적 렌더링: 이 퀘스트가 열려있다면 하위 퀘스트들을 밑에 그려줌! */}
        {!isSubtask && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {subTodos.map(sub => renderTodoCard(sub, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center pt-2 pb-[120px] px-5">
      {/* 새로운 메인 퀘스트 추가 폼 */}
      <div className="w-full bg-[var(--card-bg)] p-4 rounded-2xl mb-5 border-l-4 border-[#9C27B0] shadow-lg transition-colors duration-300">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새로운 퀘스트 (Task)" className="w-full bg-[var(--bg-color)] border border-transparent rounded-xl text-[var(--text-color)] font-bold placeholder-[var(--sub-text)] p-4 text-base mb-3 outline-none focus:border-[#9C27B0] transition-colors duration-300" />
        <div className="text-[0.8rem] text-[var(--sub-text)] font-bold mb-2 ml-1 transition-colors">퀘스트 등급 (완료 시 EXP 획득)</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {questTypes.map(q => (
            <button key={q.id} onClick={() => { setPriority(q.id); triggerVibration(10); }} className={`p-3 rounded-xl text-[0.8rem] font-bold transition-all border ${priority === q.id ? 'text-white shadow-md transform scale-105' : 'bg-[var(--bg-color)] text-[var(--sub-text)] border-transparent'}`} style={priority === q.id ? { backgroundColor: q.color, borderColor: q.color } : {}}>
              {q.icon} {q.id}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1 mb-3 mt-3">
          <span className="text-[0.8rem] text-[var(--sub-text)] font-bold ml-1 transition-colors">기한 (시:분:초)</span>
          <input type="datetime-local" step="1" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[var(--bg-color)] border border-transparent rounded-xl text-[var(--text-color)] font-bold p-4 text-base outline-none focus:border-[#9C27B0] [color-scheme:light] dark:[color-scheme:dark] transition-colors duration-300" />
        </div>
        <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="초기 메모 (세부사항 등)" className="w-full bg-[var(--bg-color)] border border-transparent rounded-xl text-[var(--text-color)] font-bold placeholder-[var(--sub-text)] p-4 text-base mb-3 outline-none focus:border-[#9C27B0] transition-colors duration-300" />
        <button onClick={handleAddTodo} disabled={isSubmitting} className="w-full bg-[#9C27B0] hover:bg-[#8E24AA] text-white py-4 text-base font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? '저장 중...' : '+ 메인 퀘스트 등록'}
        </button>
      </div>

      {/* 리스트 렌더링 영역 */}
      <div className="w-full flex flex-col">
        <h3 className="text-xl font-bold text-[#9C27B0] ml-1 mb-2">🔥 진행 중인 퀘스트</h3>
        {rootTodos.length === 0 ? (
          <div className="text-center text-[var(--sub-text)] py-10 bg-[var(--card-bg)] rounded-2xl text-sm transition-colors duration-300 mt-2">등록된 퀘스트가 없습니다.</div>
        ) : (
          rootTodos.map(todo => renderTodoCard(todo, false)) // ⭐️ 여기서 만능 함수를 호출!
        )}
      </div>

      <ProofOfWorkModal isOpen={isProofOpen} onClose={() => setIsProofOpen(false)} onConfirm={handleConfirmProof} taskTitle={selectedTodo?.title || ''} />
      <AARModal isOpen={isAAROpen} onClose={() => setIsAAROpen(false)} onConfirm={handleConfirmDiscard} taskTitle={selectedDiscardTodo?.title || ''} />
    </div>
  );
}