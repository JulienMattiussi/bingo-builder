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
  type: "tile-checked" | "tile-unvalidated" | "tile-validated" | "player-won";
  playerName: string;
  message: string;
  tilePosition?: number;
}

export interface PeerMessage {
  type:
    | "player-join"
    | "player-state"
    | "tile-validated"
    | "tile-unvalidated"
    | "player-won";
  playerName: string;
  peerId?: string;
  checkedCount: number;
}

export interface PlayerData {
  peerId: string;
  name: string;
  checkedCount: number;
  isMe: boolean;
}
