// Simple retro synthesizer using Web Audio API
// This avoids loading external MP3s and ensures low latency

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Helper: Create an oscillator with an envelope
const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol = 0.1) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
};

export const playSfx = (type: 'select' | 'cancel' | 'start' | 'hit' | 'crit' | 'miss' | 'win' | 'switch') => {
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    switch (type) {
        case 'select': // High blip
        playTone(600, 'triangle', 0.1, t);
        break;

        case 'cancel': // Lower blip
        playTone(300, 'triangle', 0.1, t);
        break;

        case 'switch': // Slide whistle effect
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.2);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
        }
        break;

        case 'start': // Power up
        playTone(440, 'square', 0.1, t);
        playTone(554, 'square', 0.1, t + 0.1);
        playTone(659, 'square', 0.2, t + 0.2);
        break;

        case 'hit': // 8-bit Punch
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
        }
        break;

        case 'crit': // High ringing impact
        playTone(880, 'square', 0.1, t, 0.2);
        playTone(1100, 'square', 0.1, t + 0.05, 0.2);
        playTone(1760, 'square', 0.3, t + 0.1, 0.1);
        break;

        case 'miss': // Sad slide down
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.4);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        }
        break;

        case 'win': // Victory Fanfare
        const melody = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        melody.forEach((freq, i) => {
            playTone(freq, 'square', 0.2, t + i * 0.15, 0.15);
        });
        playTone(1046.50, 'square', 0.6, t + 0.6, 0.15); // Final note held longer
        break;
    }
  } catch (e) {
    console.warn("Audio play failed", e);
  }
};