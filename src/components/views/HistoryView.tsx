"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerVibration } from '@/lib/gamification';

export default function HistoryView() {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const { user } = useStore();

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['완료', '폐기'])
      .order('created_at', { ascending: false });
    
    if (!error && data) setHistory(data);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 영구 삭제하시겠습니까?")) return;
    triggerVibration(20);
    await supabase.from('todos').delete().eq('id', id);
    fetchHistory();
  };

  // 마스터 타임라인 필터링
  const filteredHistory = history.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Type_Action') return item.type === 'Action';
    if (filter === 'Type_Todo') return item.type === 'Todo';
    return item.priority === filter; // Action 카테고리 필터
  });

  const getBadgeColor = (item: any) => {
    if (item.type === 'Todo') {
      if (item.status === '폐기') return '#F44336';
      return '#00E676'; // 완료
    }
    // Action 색상
    const catColors: any = { Health: '#FF6B00', Business: '#007BFF', Study: '#9C27B0', Life: '#00E676', Record: '#00E5FF' };
    return catColors[item.priority] || '#107C41';
  };

  return (
    <div className="flex flex-col pt-5 pb-[120px]">
      <div className="flex justify-between items-center px-6 mb-4">
        <h2 className="text-xl font-black text-[#107C41] font-montserrat">Master Timeline</h2>
      </div>

      <div className="flex overflow-x-auto whitespace-nowrap gap-2 px-6 pb-4 scrollbar-hide">
        {['All', 'Type_Action', 'Type_Todo', 'Health', 'Business', 'Study', 'Life', 'Record'].map(f => (
          <button
            key={f} onClick={() => { setFilter(f); triggerVibration(10); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${filter === f ? 'bg-[#107C41] text-white border-[#107C41]' : 'bg-[#2a2a2a] text-[#888] border-transparent'}`}
          >
            {f === 'All' ? '전체보기' : f === 'Type_Action' ? '⚡️ 액션만' : f === 'Type_Todo' ? '📝 할일만' : f === 'Business' ? 'Biz' : f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-6 mt-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center text-[#555] py-10 bg-[#1e1e1e] rounded-2xl text-sm">해당하는 기록이 없습니다.</div>
        ) : (
          filteredHistory.map(item => {
            const color = getBadgeColor(item);
            return (
              <div key={item.id} className="bg-[#1e1e1e] border-l-4 rounded-xl p-4 flex flex-col transition-all" style={{ borderLeftColor: color }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter" style={{ color: color, backgroundColor: `${color}20` }}>
                      {item.type === 'Todo' ? 'To-Do' : item.priority}
                    </span>
                    <span className="text-[0.65rem] bg-[#444] text-white px-1.5 py-0.5 rounded">{item.status}</span>
                  </div>
                  <div className="text-right text-[0.65rem] text-[#888] leading-tight">
                    {new Date(item.created_at).toLocaleDateString()}<br/>
                    {item.status_time && <span className="text-[#555]">({item.status_time.split(' ')[2] || item.status_time})</span>}
                  </div>
                </div>
                
                <div className="font-bold text-[#eee] text-[1.05rem] leading-tight mb-2 pr-10">{item.title}</div>
                
                {item.remark && item.remark !== '기록 없음' && item.remark !== '내용 없음' && (
                  <div className="text-[0.8rem] text-[#ccc] bg-[#333] p-2.5 rounded-lg mb-3 leading-relaxed">
                    💡 {item.remark}
                  </div>
                )}
                
                <button onClick={() => handleDelete(item.id)} className="self-end px-3 py-1 bg-[#2a2a2a] hover:bg-red-900 text-[#888] hover:text-white rounded-md text-[0.7rem] font-bold transition-colors">
                  기록 영구 삭제
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}