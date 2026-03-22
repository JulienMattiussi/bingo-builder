export interface Tile {
  value: string;
  position: number;
}

export interface Card {
  _id: string;
  title: string;
  createdBy: string;
  rows: number;
  columns: number;
  tiles: Tile[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CardProgress {
  played: boolean;
  completed: boolean;
  checkedCount: number;
  checkedTiles: number[];
}

export interface Notification {
  id: string;
  type: "tile-checked" | "tile-unvalidated" | "player-won";
  playerName: string;
  message: string;
  tilePosition?: number;
}

export interface PeerData {
  type: string;
  playerName?: string;
  checkedTiles?: number[];
  position?: number;
  [key: string]: unknown;
}

export interface PlayerInfo {
  id: string;
  name: string;
  checkedTiles: number[];
  isWinner: boolean;
}
