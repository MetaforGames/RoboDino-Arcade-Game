export type DinoType = 'triceratops' | 'velociraptor' | 'trex';

export interface GameState {
  score: number;
  coins: number;
  isGameOver: boolean;
  isRobot: boolean;
  dinoType: DinoType;
}

export const DINO_STATS = {
  triceratops: { color: '#4a5a73', name: 'Triceratops', jumpForce: -12, gravity: 0.6 },
  velociraptor: { color: '#dc2626', name: 'Velociraptor', jumpForce: -10, gravity: 0.5 },
  trex: { color: '#4d7c0f', name: 'T-Rex', jumpForce: -14, gravity: 0.7 },
};
