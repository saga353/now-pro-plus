'use client';
import { useState } from 'react';

interface AARModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memo: string) => void;
  taskTitle: string;
}

export default function AARModal({ isOpen, onClose, onConfirm, taskTitle }: AARModalProps) {
  const [memo, setMemo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    // 마찰력: 최소 2글자 이상 적어야만 폐기 가능!
    if (memo.trim().length < 2) {
      alert("최소 2자 이상의 실패 원인을 남겨주세요!");
      return;
    }
    onConfirm(memo); 
    setMemo('');     
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* ⭐️ 팝업창 본체: 붉은색 테두리로 경각심 부여 */}
      <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-500/50 transition-colors duration-300">
        
        <h3 className="text-xl font-black text-red-500 mb-2">똑똑한 실패 (AAR)</h3>
        
        <p className="text-sm text-[var(--sub-text)] mb-6 transition-colors">
          <span className="text-red-400 font-bold">[{taskTitle}]</span> 퀘스트를 포기하시겠습니까? 실패는 자산입니다.<br/>무엇이 실행을 막았는지 기록해 보세요.
        </p>

        {/* 📝 실패 원인 입력창 */}
        <textarea
          className="w-full bg-[var(--bg-color)] text-[var(--text-color)] placeholder-[var(--sub-text)] font-bold border border-gray-200 dark:border-[#333] rounded-xl p-4 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors duration-300 resize-none mb-4"
          rows={3}
          placeholder="예: 시간이 부족했다, 목표가 너무 컸다 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-[var(--sub-text)] bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors duration-300"
          >
            다시 도전
          </button>
          <button 
            onClick={handleSubmit}
            disabled={memo.trim().length < 2}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-700 disabled:opacity-50 transition-opacity shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            기록 및 폐기
          </button>
        </div>
      </div>
    </div>
  );
}