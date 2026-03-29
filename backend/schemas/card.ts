import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import config from "../config/config.js";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Tile Schema - Individual bingo tile
 */
export const TileSchema = z
  .object({
    value: z
      .string()
      .max(config.get("limits.tileMaxLength"))
      .default("")
      .openapi({
        description: "Content of the tile",
        example: "Free space",
      }),
    position: z.number().int().min(0).openapi({
      description: "Position in the grid (0-indexed)",
      example: 0,
    }),
  })
  .openapi("Tile");

/**
 * Card Input Schema - For creating new cards
 */
export const CardInputSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(config.get("limits.cardTitleMaxLength"))
      .openapi({
        description: "Card title",
        example: "My Bingo Card",
      }),
    createdBy: z.string().default("").openapi({
      description: "Creator name (optional)",
      example: "John Doe",
    }),
    ownerId: z.string().uuid("Invalid user ID format").openapi({
      description: "Secret user ID for ownership verification (UUID v4)",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    rows: z
      .number()
      .int()
      .min(2, "Minimum 2 rows")
      .max(5, "Maximum 5 rows")
      .openapi({
        description: "Number of rows in the grid",
        example: 3,
      }),
    columns: z
      .number()
      .int()
      .min(2, "Minimum 2 columns")
      .max(6, "Maximum 6 columns")
      .openapi({
        description: "Number of columns in the grid",
        example: 3,
      }),
    tiles: z
      .array(TileSchema)
      .min(4, "Minimum 4 tiles (2x2 grid)")
      .max(30, "Maximum 30 tiles (5x6 grid)")
      .openapi({
        description: "Array of tiles (length must equal rows × columns)",
      }),
  })
  .refine((data) => data.tiles.length === data.rows * data.columns, {
    message: "Number of tiles must match grid size (rows × columns)",
    path: ["tiles"],
  })
  .openapi("CardInput");

/**
 * Card Update Schema - For updating existing cards
 */
export const CardUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .max(config.get("limits.cardTitleMaxLength"))
      .optional(),
    createdBy: z.string().optional(),
    ownerId: z.string().uuid("Invalid user ID format").openapi({
      description: "Secret user ID for ownership verification (UUID v4)",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    rows: z.number().int().min(2).max(5).optional(),
    columns: z.number().int().min(2).max(6).optional(),
    tiles: z.array(TileSchema).min(4).max(30).optional(),
  })
  .openapi("CardUpdate");

/**
 * Card Schema - Complete card with database fields
 */
export const CardSchema = z
  .object({
    _id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
      .openapi({
        description: "MongoDB ObjectId",
        example: "507f1f77bcf86cd799439011",
      }),
    title: z.string().max(config.get("limits.cardTitleMaxLength")).openapi({
      description: "Card title",
    }),
    createdBy: z.string().default("").openapi({
      description: "Creator name (public nickname)",
    }),
    ownerId: z.string().uuid().openapi({
      description:
        "Secret user ID for ownership verification (UUID v4) - never shared with other users",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    rows: z.number().int().min(2).max(5).openapi({
      description: "Number of rows",
    }),
    columns: z.number().int().min(2).max(6).openapi({
      description: "Number of columns",
    }),
    tiles: z.array(TileSchema).openapi({
      description: "Array of tiles",
    }),
    isPublished: z.boolean().default(false).openapi({
      description: "Whether the card is published and playable",
    }),
    publishedAt: z.string().datetime().nullable().optional().openapi({
      description: "When the card was published",
    }),
    createdAt: z.string().datetime().openapi({
      description: "When the card was created",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "When the card was last updated",
    }),
  })
  .openapi("Card");

/**
 * Ownership verification schema
 */
export const OwnershipSchema = z.object({
  ownerId: z.string().uuid("Invalid user ID format").openapi({
    description: "Secret user ID for ownership verification (UUID v4)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  createdBy: z.string().optional().openapi({
    description: "Creator name (optional, for backward compatibility)",
  }),
});

/**
 * Delete by creator schema
 */
export const DeleteByCreatorSchema = z.object({
  createdBy: z.string().min(1, "Creator name is required").openapi({
    description: "Creator name",
  }),
});

/**
 * Update creator name schema
 */
export const UpdateCreatorSchema = z.object({
  oldName: z.string().min(1, "Old name is required").openapi({
    description: "Current creator name",
  }),
  newName: z.string().min(1, "New name is required").openapi({
    description: "New creator name",
  }),
});

// Export TypeScript types
export type Tile = z.infer<typeof TileSchema>;
export type CardInput = z.infer<typeof CardInputSchema>;
export type CardUpdate = z.infer<typeof CardUpdateSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Ownership = z.infer<typeof OwnershipSchema>;
export type DeleteByCreator = z.infer<typeof DeleteByCreatorSchema>;
export type UpdateCreator = z.infer<typeof UpdateCreatorSchema>;
