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

export interface GetCardsResponse extends Array<Card> {}

export interface GetCardResponse extends Card {}

export interface DeleteCardResponse {
  message: string;
}

export interface UnpublishCardResponse extends Card {}
