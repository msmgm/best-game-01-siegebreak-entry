// Procedural sound only: every effect is synthesised with WebAudio (oscillators and filtered
// noise), so the game needs no audio files and stays offline. The audio context is created on
// the first user gesture; before that every call is a silent no-op.
export function createAudio() {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let noiseBuffer = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(muted ? 0 : 0.5, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function getNoiseBuffer() {
    if (!audioCtx) return null;
    if (!noiseBuffer) {
      const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
      noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return noiseBuffer;
  }

  function unlock() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 0.5, audioCtx.currentTime);
    }
  }

  function isMuted() {
    return muted;
  }

  function thud() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 90 Hz sine dropping to 50 Hz over 0.12 s
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.12);

    // Short noise burst through lowpass filter
    const nb = getNoiseBuffer();
    if (nb) {
      const source = ctx.createBufferSource();
      source.buffer = nb;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      source.start(now);
      source.stop(now + 0.06);
    }
  }

  function boom() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 55 Hz sine with slow decay (0.5 s)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.5);

    // Brown-ish noise through lowpass at 300 Hz
    const nb = getNoiseBuffer();
    if (nb) {
      const source = ctx.createBufferSource();
      source.buffer = nb;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      source.start(now);
      source.stop(now + 0.5);
    }
  }

  function crumble() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Band-passed noise around 800 Hz for 0.4 s with falling gain
    const nb = getNoiseBuffer();
    if (nb) {
      const source = ctx.createBufferSource();
      source.buffer = nb;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      source.start(now);
      source.stop(now + 0.4);
    }
  }

  function fire() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crackle: five short noise bursts spaced over 0.35 s
    const nb = getNoiseBuffer();
    if (nb) {
      for (let i = 0; i < 5; i++) {
        const timeOffset = i * 0.07;
        const startT = now + timeOffset;
        const dur = 0.04;

        const source = ctx.createBufferSource();
        source.buffer = nb;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000 + Math.random() * 500, startT);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startT);
        source.stop(startT + dur);
      }
    }
  }

  function win() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // 523, 659, 784 Hz

    for (let i = 0; i < 3; i++) {
      const startT = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[i], startT);

      gain.gain.setValueAtTime(0.3, startT);
      gain.gain.setValueAtTime(0.3, startT + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.12);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startT);
      osc.stop(startT + 0.12);
    }
  }

  function lose() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [330.0, 196.0]; // 330 then 196 Hz

    for (let i = 0; i < 2; i++) {
      const startT = now + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i], startT);

      gain.gain.setValueAtTime(0.4, startT);
      gain.gain.setValueAtTime(0.4, startT + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startT);
      osc.stop(startT + 0.25);
    }
  }

  function click() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1200 Hz blip, 0.04 s
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  return {
    unlock,
    thud,
    boom,
    crumble,
    fire,
    win,
    lose,
    click,
    setMuted,
    isMuted
  };
}


