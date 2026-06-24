import { getEmbeddableUrl } from './utils';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sounds: Record<string, HTMLAudioElement> = {};
  private currentLoop: HTMLAudioElement | null = null;
  private soundUrls = {
    startAnim: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1NsuNLf2gUAdPSzJqVdd1yMVVojgLGw1Z'),
    highscoreLoop: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1lN8HSJ1Gz9ZiUXL6XPl1DeOSs_VH2-c1'),
    inGameLoop: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1GQp0FDKFKZkBu6cA2dh3B5_wB5K9sDw3'),
    startGame: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1EPdRfW8nfQxkwZowPQN2gUSnmj_qkfoE'),
    coin: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1PWTqiD4SpjMCQlj6J11Ua3786E5E3I8y'),
    die: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1Tp6U4UH3hZI-PCEhiMuvcjLPva8NFBuX'),
    hurt: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=14Bt58hYfLmwGfGel0Bwv0ptSdmMIPlha'),
    breakObstacle: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1ouqpM7PTRg1jC4KmR2zKpNw-66jSBkXX'),
    transform: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1GZZU7C2LnD2dbO1ikwwEZi603PW0pyN6'),
    achievement: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=11ksoGGgnZQ1iaW0aHrnl6HhfPVa0RtL9'),
    jumpPothole: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1macSWj3Bt8xNfk0_taNhJX_GZWxmW1pQ'),
    selectDino: getEmbeddableUrl('https://drive.google.com/uc?export=download&id=1WAXvvRPX3zizspfpXh8m_vqpmWMozazl'),
  };
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Preload sounds
    Object.entries(this.soundUrls).forEach(([key, url]) => {
      if (!this.sounds[key]) {
        const audio = new Audio(url);
        this.sounds[key] = audio;
      }
    });
  }

  private playSound(key: string, loop = false, volume = 1) {
    if (this.sounds[key]) {
      const audio = this.sounds[key].cloneNode() as HTMLAudioElement;
      audio.loop = loop;
      audio.volume = volume;
      audio.play().catch(e => console.warn(`Failed to play ${key}`, e));
      return audio;
    }
    return null;
  }

  playStartAnim() {
    this.playSound('startAnim');
  }
  
  playHighscoreLoop() {
    this.stopLoop();
    this.currentLoop = this.playSound('highscoreLoop', true, 0.5);
  }
  
  playInGameLoop() {
    this.stopLoop();
    this.currentLoop = this.playSound('inGameLoop', true, 0.4);
  }
  
  stopLoop() {
    if (this.currentLoop) {
      this.currentLoop.pause();
      this.currentLoop.currentTime = 0;
      this.currentLoop = null;
    }
  }

  playStartGame() {
    this.playSound('startGame');
  }

  playCoin() {
    this.playSound('coin', false, 0.7);
  }

  playDie() {
    this.playSound('die');
  }

  playHurt() {
    this.playSound('hurt');
  }

  playBreakObstacle() {
    this.playSound('breakObstacle');
  }

  playTransform() {
    this.playSound('transform');
  }

  playAchievement() {
    this.playSound('achievement');
  }

  playJumpPothole() {
    this.playSound('jumpPothole');
  }

  playSelectDino() {
    this.playSound('selectDino');
  }

  playJump() {
    // Keep synth fallback for generic jump if pothole is only for pothole
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit() {
    this.playHurt();
  }
  
  playWhoosh() {}
  playBarge() { this.playBreakObstacle(); }
  playBite() {}
  playNitro() {}
}

export const audioEngine = new AudioEngine();
