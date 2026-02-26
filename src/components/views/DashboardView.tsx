"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration } from '@/lib/gamification';

export default function DashboardView() {
  const [items, setItems] = useState<any[]>([]);
  const [detailStatus, setDetailStatus] = useState<string | null>(null);
  const { user } = useStore();

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      // Action과 Todo 모든 데이터를 가져옵니다.
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) setItems(data);
    };
    fetchAll();
  }, [user]);

  // 통계 데이터 분리 계산
  const actions = items.filter(item => item.type === 'Action');
  const todos = items.filter(item => item.type === 'Todo');

  const actionTotal = actions.length;
  const actionBiz = actions.filter(a => a.priority === 'Business').length;

  const todoTotal = todos.length;
  const todoReg = todos.filter(t => t.status === '등록').length;
  const todoIng = todos.filter(t => t.status === '진행중').length;
  const todoPending = todos.filter(t => t.status === '보류').length;
  const todoDone = todos.filter(t => t.status === '완료').length;
  const todoDiscard = todos.filter(t => t.status === '폐기').length;

  // 카드 클릭 시 디테일 뷰 열기
  const handleBoxClick = (status: string) => {
    setDetailStatus(status);
    triggerVibration(10);
  };

  // --- [디테일 뷰 렌더링] ---
  if (detailStatus) {
    const filteredTodos = detailStatus === '전체' ? todos : todos.filter(t => t.status === detailStatus);
    
    let titleColor = '#00E676'; 
    if (detailStatus === '등록') titleColor = '#00BCD4'; 
    if (detailStatus === '진행중') titleColor = '#007BFF'; 
    if (detailStatus === '보류') titleColor = '#FF9800'; 
    if (detailStatus === '폐기') titleColor = '#F44336';

    return (
      <div className="flex flex-col pt-5 pb-[120px] px-6 animate-fade-swipe">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#333]">
          <button 
            onClick={() => { setDetailStatus(null); triggerVibration(10); }}
            className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
          >
            ⬅ 뒤로
          </button>
          <h3 className="text-xl font-bold" style={{ color: titleColor }}>
            {detailStatus === '전체' ? '전체 할일 상세 내역' : `[${detailStatus}] 상세 내역`}
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center text-[#555] py-10 bg-[#1e1e1e] rounded-2xl text-sm">해당 상태의 할일이 없습니다.</div>
          ) : (
            filteredTodos.map(todo => {
              let statusColor = '#00BCD4'; 
              if (todo.status === '진행중') statusColor = '#007BFF'; 
              if (todo.status === '완료') statusColor = '#00E676'; 
              if (todo.status === '보류') statusColor = '#FF9800'; 
              if (todo.status === '폐기') statusColor = '#F44336';

              return (
                <div key={todo.id} className="bg-[#1a1a1a] border-l-4 rounded-xl p-4 flex flex-col gap-1 shadow-md" style={{ borderLeftColor: statusColor }}>
                  <span className="font-bold text-[#eee] text-lg mb-1">{todo.title}</span>
                  <div className="text-xs text-[#888] flex flex-col gap-1">
                    <span>📌 등록: {new Date(todo.created_at).toLocaleDateString('ko-KR')}</span>
                    <span>📅 기한: {todo.deadline_at ? new Date(todo.deadline_at).toLocaleString('ko-KR') : '미정'}</span>
                  </div>
                  {todo.remark && todo.remark !== '내용 없음' && (
                    <div className="text-[0.8rem] text-[#ccc] bg-[#333] p-2 rounded-lg mt-2 leading-relaxed">
                      📝 {todo.remark}
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="text-[0.7rem] px-2 py-1 bg-[#222] rounded-md font-bold" style={{ color: statusColor }}>
                      ● {todo.status} {todo.status_time && <span className="text-[#666] ml-1 font-normal">({todo.status_time.split(' ')[2] || todo.status_time})</span>}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- [메인 대시보드 렌더링] ---
  return (
    <div className="flex flex-col items-center pt-2 pb-[120px] px-5 animate-fade-swipe">
      
      {/* Action 통계 */}
      <div className="w-full bg-[#1e1e1e] border-t-4 border-[#00E676] rounded-2xl p-5 mb-5 shadow-lg">
        <div className="text-sm text-[#888] font-bold mb-4">📈 Action 요약 (완료된 행동)</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#2a2a2a] p-4 rounded-xl text-center">
            <div className="font-montserrat text-3xl font-black text-white">{actionTotal}</div>
            <div className="text-xs text-[#888] mt-1">총 실행 횟수</div>
          </div>
          <div className="bg-[#2a2a2a] p-4 rounded-xl text-center">
            <div className="font-montserrat text-3xl font-black text-[#007BFF]">{actionBiz}</div>
            <div className="text-xs text-[#888] mt-1">Biz 분야 실행</div>
          </div>
        </div>
      </div>

      {/* Todo 통계 (터치 가능) */}
      <div className="w-full bg-[#1e1e1e] border-t-4 border-[#9C27B0] rounded-2xl p-5 mb-5 shadow-lg">
        <div className="text-sm text-[#888] font-bold mb-4">📋 해야할 일 현황 <span className="text-[#555] text-xs font-normal">(터치하여 상세 보기)</span></div>
        <div className="grid grid-cols-2 gap-3">
          <StatBox title="전체 할일" count={todoTotal} color="#ffffff" onClick={() => handleBoxClick('전체')} />
          <StatBox title="등록됨" count={todoReg} color="#00BCD4" onClick={() => handleBoxClick('등록')} />
          <StatBox title="진행중" count={todoIng} color="#007BFF" onClick={() => handleBoxClick('진행중')} />
          <StatBox title="보류 중" count={todoPending} color="#FF9800" onClick={() => handleBoxClick('보류')} />
          <StatBox title="완료 됨" count={todoDone} color="#00E676" onClick={() => handleBoxClick('완료')} />
          <StatBox title="폐기 됨" count={todoDiscard} color="#F44336" onClick={() => handleBoxClick('폐기')} />
        </div>
      </div>

      {/* 시스템 상태창 */}
      <div className="w-full bg-[#1e1e1e] border-t-4 border-[#555] rounded-2xl p-5 shadow-lg">
        <div className="text-sm text-[#888] font-bold mb-3">⚙️ 시스템 DB 관리</div>
        <div className="bg-[#111] border border-[#333] rounded-xl p-4 text-center">
          <div className="text-xl mb-2">☁️</div>
          <div className="text-[#00E676] font-bold text-sm mb-1">클라우드 실시간 동기화 중</div>
          <div className="text-[#666] text-xs leading-relaxed">
            모든 데이터는 Supabase 서버에 안전하게 보관되며,<br/>어떤 기기에서 접속해도 동일하게 유지됩니다.
          </div>
        </div>
      </div>

    </div>
  );
}

// 재사용 가능한 통계 박스 컴포넌트
function StatBox({ title, count, color, onClick }: { title: string, count: number, color: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#2a2a2a] p-4 rounded-xl text-center cursor-pointer transition-all active:scale-95 hover:bg-[#333] border border-transparent hover:border-[#555]"
    >
      <div className="font-montserrat text-3xl font-black" style={{ color: color }}>{count}</div>
      <div className="text-xs text-[#888] mt-1">{title}</div>
    </div>
  );
}