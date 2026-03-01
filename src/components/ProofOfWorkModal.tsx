'use client';
import { useState } from 'react';

interface ProofOfWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memo: string) => void;
  taskTitle: string;
}

export default function ProofOfWorkModal({ isOpen, onClose, onConfirm, taskTitle }: ProofOfWorkModalProps) {
  const [memo, setMemo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (memo.trim().length < 2) {
      alert("최소 2자 이상의 증명 메모를 남겨주세요!");
      return;
    }
    onConfirm(memo); 
    setMemo('');     
  };

  return (
    // ⭐️ 바깥쪽 블러 배경
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* ⭐️ 팝업창 본체 배경: bg-[var(--card-bg)] */}
      <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-[#333] transition-colors duration-300">
        
        {/* ⭐️ 타이틀 텍스트: text-[var(--text-color)] */}
        <h3 className="text-xl font-bold text-[var(--text-color)] mb-2 transition-colors">작업 증명 (Proof of Work)</h3>
        
        {/* ⭐️ 설명 텍스트: text-[var(--sub-text)] */}
        <p className="text-sm text-[var(--sub-text)] mb-6 transition-colors">
          <span className="text-[#FF6B00] font-bold">[{taskTitle}]</span> 퀘스트를 정말 완료하셨나요? 가짜 완료를 막기 위해 흔적을 남겨주세요.
        </p>

        {/* 📷 사진 인증 버튼 */}
        <button 
          className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-[var(--sub-text)] py-3 rounded-xl mb-4 transition-colors duration-300"
          onClick={() => alert("사진 인증 기능은 다음 V2 클라우드 스토리지 업데이트에서 활성화됩니다!")}
        >
          📷 결과물 사진 촬영 (V2)
        </button>

        {/* 📝 메모 입력창: 노란색(text-[#FFD700]) 제거 -> text-[var(--text-color)] 로 교체! */}
        <textarea
          className="w-full bg-[var(--bg-color)] text-[var(--text-color)] placeholder-[var(--sub-text)] font-bold border border-gray-200 dark:border-[#333] rounded-xl p-4 focus:outline-none focus:border-[#FF6B00] dark:focus:border-[#FF6B00] transition-colors duration-300 resize-none mb-4"
          rows={3}
          placeholder="무엇을 배웠거나, 어떤 결과를 냈나요?"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-[var(--sub-text)] bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] transition-colors duration-300"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            disabled={memo.trim().length < 2}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] disabled:opacity-50 transition-opacity shadow-[0_0_15px_rgba(255,107,0,0.3)]"
          >
            증명 및 완료
          </button>
        </div>
      </div>
    </div>
  );
}