import mongoose from "mongoose";

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

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: Number(process.env.CARD_TITLE_MAX_LENGTH) || 25,
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
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

const Card = mongoose.model("Card", cardSchema);

export default Card;
