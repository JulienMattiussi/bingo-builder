import { Card, CardProgress, Tile, Notification } from "./models";

// BingoCardItem props
export interface BingoCardItemProps {
  card: Card;
  currentPlayerName: string;
  progress: CardProgress;
  onDelete?: (id: string) => void;
  onUnpublish: (id: string) => void;
}

// BingoCardPreview props
export interface BingoCardPreviewProps {
  tiles: Tile[];
  rows: number;
  columns: number;
  checkedTiles?: number[];
}

// BingoGridControls props
export interface BingoGridControlsProps {
  title: string;
  onTitleChange: (title: string) => void;
  rows: number;
  columns: number;
  onGridSizeChange: (rows: number, columns: number) => void;
  tiles: Tile[];
  showProgress?: boolean;
  checkedTiles?: number[];
}

// BingoGridEditor props
export interface BingoGridEditorProps {
  tiles: Tile[];
  rows: number;
  columns: number;
  onTileChange: (position: number, value: string) => void;
  onTileClick?: (tile: Tile) => void;
}

// CardActions props
export interface CardActionsProps {
  card: Card;
  isOwner: boolean;
  isPlayed: boolean;
  onDelete: (id: string) => void;
  onUnpublish: (id: string) => void;
}

// CardNameModal props
export interface CardNameModalProps {
  show: boolean;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

// CardStatusInfo props
export interface CardStatusInfoProps {
  card: Card;
  isOwner: boolean;
}

// MobileActionBar props
export interface MobileActionBarProps {
  buttons: Array<{
    label: string;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
  }>;
}

// Notification props
export interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

export interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

// TileEditorModal props
export interface TileEditorModalProps {
  tile: Tile | null;
  onSave: (position: number, value: string) => void;
  onClose: () => void;
}
