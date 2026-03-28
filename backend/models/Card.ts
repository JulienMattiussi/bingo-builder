import mongoose, { Document } from "mongoose";

// TypeScript interfaces
interface ITile {
  value: string;
  position: number;
}

interface ICard {
  title: string;
  createdBy: string;
  ownerId: string; // Secret user ID for ownership verification
  rows: number;
  columns: number;
  tiles: ITile[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for document with virtuals
export interface ICardDocument extends ICard, Document {
  totalTiles: number;
}

const tileSchema = new mongoose.Schema({
  value: {
    type: String,
    required: false,
    default: "",
  },
  position: {
    type: Number,
    required: true,
  },
});

import config from "../config/config.js";

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: config.get("limits.cardTitleMaxLength"),
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
    ownerId: {
      type: String,
      required: true,
      trim: true,
      // This is the secret user ID used for ownership verification
      // Never send this to other users via peer communication
    },
    rows: {
      type: Number,
      required: true,
      min: 2,
      max: 5,
    },
    columns: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },
    tiles: [tileSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual to get total tiles
cardSchema.virtual("totalTiles").get(function () {
  return this.rows * this.columns;
});

// Ensure tiles match grid size when saving
cardSchema.pre("save", function (next) {
  const expectedTiles = this.rows * this.columns;
  if (this.tiles.length !== expectedTiles) {
    next(
      new Error(
        `Card must have exactly ${expectedTiles} tiles (${this.rows}x${this.columns})`,
      ),
    );
  } else {
    next();
  }
});

const Card = mongoose.model<ICardDocument>("Card", cardSchema);

export default Card;
