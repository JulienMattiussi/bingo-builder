import { Card, Tile } from "./models";

export interface CreateCardRequest {
  title: string;
  createdBy: string;
  rows: number;
  columns: number;
  tiles: Tile[];
}

export interface UpdateCardRequest {
  title: string;
  createdBy: string;
  rows: number;
  columns: number;
  tiles: Tile[];
}

export interface CreateCardResponse {
  _id: string;
  title: string;
  createdBy: string;
  rows: number;
  columns: number;
  tiles: Tile[];
  isPublished: boolean;
}

export type GetCardsResponse = Card[];

export type GetCardResponse = Card;

export interface DeleteCardResponse {
  message: string;
}

export type UnpublishCardResponse = Card;
