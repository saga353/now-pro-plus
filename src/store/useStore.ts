import { create } from 'zustand';

interface StoreState {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  totalExp: number;
  setTotalExp: (exp: number) => void;
  addExp: (amount: number) => void;
  user: any | null; // 👈 추가: 유저 정보
  setUser: (user: any) => void; // 👈 추가: 유저 설정 함수
}

export const useStore = create<StoreState>((set) => ({
  currentTab: 'action',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  totalExp: 0,
  setTotalExp: (exp) => set({ totalExp: exp }),
  addExp: (amount) => set((state) => ({ totalExp: Math.max(0, state.totalExp + amount) })),
  user: null,
  setUser: (user) => set({ user }),
}));