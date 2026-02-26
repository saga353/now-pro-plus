import confetti from 'canvas-confetti';

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

// 공통 신디사이저 함수
function playSynth(freqs: number[], type: OscillatorType, durations: any, vol: number) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const st = now + (durations.startOffset ? durations.startOffset[i] : i * 0.1);
    const dur = durations.length ? (Array.isArray(durations.length) ? durations.length[i] : durations.length) : 0.2;

    osc.frequency.setValueAtTime(freq, st);
    if (freqs.length === 1 && type === 'sine') osc.frequency.exponentialRampToValueAtTime(1318.51, st + 0.1);

    gainNode.gain.setValueAtTime(0, st);
    gainNode.gain.linearRampToValueAtTime(vol, st + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, st + dur);

    osc.start(st);
    osc.stop(st + dur);
  });
}

export const triggerVibration = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
};

export const fireConfetti = (amount = 30) => {
  const colors = ['#FF5252', '#4CAF50', '#2196F3', '#FFD54F', '#9C27B0', '#00BCD4', '#ffffff'];
  confetti({ particleCount: amount, spread: 100, origin: { y: 0.6 }, colors, zIndex: 9999 });
};

// 🔊 사운드 세트
export const playExpSound = () => playSynth([880], 'sine', { length: 0.3 }, 0.3);
export const playJackpotSound = () => playSynth([523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98], 'triangle', { length: 0.1, startOffset: [0, 0.08, 0.16, 0.24, 0.32, 0.40] }, 0.2);
export const playLevelUpSound = () => playSynth([523.25, 783.99, 659.25, 1046.50], 'square', { length: [0.15, 0.15, 0.15, 0.6], startOffset: [0, 0.15, 0.3, 0.45] }, 0.15);

// ✨ 팝업 모션 세트 (React 밖에서 DOM을 직접 조작하여 가장 빠르고 강력하게 띄움)
export const showExpPopup = (exp: number) => {
  playExpSound();
  triggerVibration([70, 50, 70]);
  fireConfetti(30);
  const popup = document.createElement('div');
  popup.className = 'exp-popup'; popup.innerText = `+${exp} EXP`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1500);
};

export const showJackpotPopup = (exp: number) => {
  playJackpotSound();
  triggerVibration([50, 30, 50, 30, 50, 30, 200]); // 따다다다닥! 진동
  fireConfetti(80);
  const popup = document.createElement('div');
  popup.className = 'jackpot-popup';
  popup.innerHTML = `<span style="font-size:1.5rem; color:#FFF;">JACKPOT!</span><br>+${exp} EXP`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1800);
};

export const showLevelUpPopup = (newLevel: number) => {
  playLevelUpSound();
  triggerVibration([100, 50, 100, 50, 100, 50, 400]);
  fireConfetti(150);
  let overlay = document.getElementById('levelup-overlay');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'levelup-overlay'; overlay.className = 'levelup-overlay';
    overlay.innerHTML = `
      <div class="levelup-text">LEVEL UP!</div>
      <div style="font-size:1.8rem; color:white; margin-top:20px; font-weight:bold; font-family:var(--font-montserrat), sans-serif;">Lv.<span id="lu-num"></span> 달성</div>
      <div style="font-size:0.9rem; color:#aaa; margin-top:30px;">화면을 터치하여 계속하기</div>`;
    document.body.appendChild(overlay);
    overlay.onclick = () => overlay.classList.remove('active');
  }
  (document.getElementById('lu-num') as HTMLElement).innerText = newLevel.toString();
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 4000);
};