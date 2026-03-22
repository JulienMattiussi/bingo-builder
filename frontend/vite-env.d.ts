/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_PORT: string;
  readonly VITE_PORT: string;
  readonly VITE_CARD_TITLE_MAX_LENGTH: string;
  readonly VITE_TILE_MAX_LENGTH: string;
  readonly VITE_PLAYER_NAME_MAX_LENGTH: string;
  readonly VITE_MAX_PLAYERS_PER_CARD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
