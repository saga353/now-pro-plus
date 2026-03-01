"use client";
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import ActionView from '@/components/views/ActionView';
import TodoView from '@/components/views/TodoView';
import HistoryView from '@/components/views/HistoryView';
import DashboardView from '@/components/views/DashboardView';
import CalendarView from '@/components/views/CalendarView';
import SplashScreen from '@/components/SplashScreen';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { currentTab, setCurrentTab, setUser, setTotalExp, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const viewOrder = ['action', 'todo', 'calendar', 'history', 'dashboard'];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = Math.abs(touchEndX - touchStartX.current);
    const diffY = Math.abs(touchEndY - touchStartY.current);

    if (diffY > diffX) return;
    const threshold = 50;
    const currentIndex = viewOrder.indexOf(currentTab);

    if (touchEndX < touchStartX.current - threshold) {
      if (currentIndex < viewOrder.length - 1) {
        setCurrentTab(viewOrder[currentIndex + 1]);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    } else if (touchEndX > touchStartX.current + threshold) {
      if (currentIndex > 0) {
        setCurrentTab(viewOrder[currentIndex - 1]);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          const { data } = await supabase.from('profiles').select('total_exp').eq('id', session.user.id).single();
          if (data) setTotalExp(data.total_exp);
        }
      } catch (err) {
        console.error("초기 로딩 에러:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [setUser, setTotalExp]);

  const handleLogin = async () => {
    const email = prompt("사용할 이메일을 입력하세요 (예: test@test.com)");
    const password = prompt("비밀번호를 입력하세요 (6자리 이상)");
    if (email && password) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) alert("오류 발생: " + signUpError.message);
        else alert("회원가입 성공! 이제 로그인 버튼을 다시 눌러주세요.");
      } else {
        setUser(data.user);
        window.location.reload();
      }
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) return <div className="h-screen bg-[#121212] flex items-center justify-center text-[#888] font-bold">시스템 로딩 중...</div>;

  return (
    // ⭐️ 핵심: bg-[var(--bg-color)] text-[var(--text-color)] 로 변경!
    <main 
      className="flex flex-col h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans overflow-hidden animate-in fade-in duration-700 transition-colors duration-300"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Header />
      
      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-swipe">
          <h2 className="font-montserrat text-4xl font-black mb-4 text-[#FF6B00]">Now:[ ]</h2>
          <p className="text-[var(--sub-text)] mb-8 leading-relaxed">클라우드 동기화와<br/>데이터 보호를 위해 로그인이 필요합니다.</p>
          <button onClick={handleLogin} className="w-full max-w-[300px] bg-gradient-to-r from-[#FF6B00] to-[#FF9800] py-4 rounded-2xl font-bold text-white text-lg shadow-lg active:scale-95 transition-transform">
            시작하기 (로그인/가입)
          </button>
        </div>
      ) : (
        <div key={currentTab} className="flex-1 overflow-y-auto w-full max-w-[500px] mx-auto scrollbar-hide animate-fade-swipe">
          {currentTab === 'action' && <ActionView />}
          {currentTab === 'todo' && <TodoView />}
          {currentTab === 'calendar' && <CalendarView />}
          {currentTab === 'history' && <HistoryView />}
          {currentTab === 'dashboard' && <DashboardView />}
        </div>
      )}

      <BottomNav />
    </main>
  );
}