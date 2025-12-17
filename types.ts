
export interface Move {
  name: string;
  description: string;
  type: string;
  power: number;
  accuracy: number;
  visual_prompt: string; // Short English description for image generation
}

export interface AnimalStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface AnimalData {
  species: string;
  title: string;
  element: string;
  flavorText: string;
  stats: AnimalStats;
  moves: Move[];
}

export interface Player {
  id: number;
  label: string; // "Player 1" or "Player 2"
  currentHp: number;
  maxHp: number;
}

export interface SavedAnimal {
  id: string; // Unique ID (timestamp based)
  data: AnimalData;
  imageBase64: string; // Stored as base64 for offline loading
  createdAt: number;
}

export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';
// New phases: 
// upload: waiting for both images
// battle_ready: images ready, calculating speed
// battle_turn: players selecting moves
// round_end: clearing cards
export type GamePhase = 'setup' | 'upload' | 'battle_turn' | 'round_end' | 'gameover';

// New Types for Fun Features
export type WeatherType = 'sunny' | 'rain' | 'snow' | 'wind' | 'sandstorm';

export interface BanterData {
    p1Line: string;
    p2Line: string;
}