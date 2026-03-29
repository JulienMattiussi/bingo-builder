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

/**
 * Export Response Schema - Response from card export
 */
export const ExportResponseSchema = z
  .object({
    version: z.string().openapi({
      description: "Export format version",
      example: "2.0",
    }),
    exportDate: z.string().datetime().openapi({
      description: "When the export was generated",
      example: "2024-03-29T10:30:00.000Z",
    }),
    user: z
      .object({
        nickname: z.string().openapi({
          description: "User's player nickname",
          example: "JohnDoe",
        }),
        ownerId: z.string().uuid().openapi({
          description: "User's unique owner ID",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      })
      .openapi({
        description: "User data for identity restoration",
      }),
    cardCount: z.number().int().min(0).openapi({
      description: "Number of cards in the export",
      example: 5,
    }),
    cards: z
      .array(
        z.object({
          _id: z.string().openapi({
            description: "MongoDB ObjectId (prevents duplicates on import)",
            example: "507f1f77bcf86cd799439011",
          }),
          title: z.string(),
          createdBy: z.string(),
          ownerId: z.string().uuid(),
          rows: z.number().int(),
          columns: z.number().int(),
          tiles: z.array(TileSchema),
          isPublished: z.boolean(),
          publishedAt: z.string().datetime().nullable().optional(),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        }),
      )
      .openapi({
        description: "Array of exported cards (with _id for de-duplication)",
      }),
    progress: z
      .record(
        z.string(),
        z.array(z.number().int()).openapi({
          description: "Array of checked tile indices",
        }),
      )
      .openapi({
        description: "Card play progress (cardId -> checked tiles)",
      }),
  })
  .openapi("ExportResponse");

/**
 * Import Request Schema - Request body for card import
 */
export const ImportRequestSchema = z
  .object({
    ownerId: z.string().uuid("Invalid user ID format").openapi({
      description: "Current user's ID (for ownership verification)",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    user: z
      .object({
        nickname: z.string().optional(),
        ownerId: z.string().uuid(),
      })
      .optional()
      .openapi({
        description: "User data from export (optional)",
      }),
    cards: z
      .array(
        z.object({
          _id: z.string().optional().openapi({
            description:
              "MongoDB ObjectId from export (used to avoid duplicates)",
          }),
          title: z.string().min(1).max(config.get("limits.cardTitleMaxLength")),
          createdBy: z.string().default(""),
          ownerId: z.string().uuid().optional(), // Will be overridden
          rows: z.number().int().min(2).max(5),
          columns: z.number().int().min(2).max(6),
          tiles: z.array(TileSchema).min(4).max(30),
          isPublished: z.boolean().optional(),
          publishedAt: z.string().datetime().nullable().optional(),
          createdAt: z.string().datetime().optional(),
          updatedAt: z.string().datetime().optional(),
        }),
      )
      .min(1, "At least one card is required")
      .openapi({
        description: "Array of cards to import",
      }),
    progress: z
      .record(z.string(), z.array(z.number().int()))
      .optional()
      .openapi({
        description: "Card play progress to restore (optional)",
      }),
  })
  .openapi("ImportRequest");

/**
 * Import Response Schema - Response from card import
 */
export const ImportResponseSchema = z
  .object({
    importedCount: z.number().int().min(0).openapi({
      description: "Number of cards successfully imported/updated",
      example: 4,
    }),
    skippedCount: z.number().int().min(0).openapi({
      description: "Number of cards skipped (already exist with same content)",
      example: 1,
    }),
    errorCount: z.number().int().min(0).openapi({
      description: "Number of cards that failed to import",
      example: 1,
    }),
    errors: z
      .array(
        z.object({
          index: z.number().int().min(0).openapi({
            description: "Index of the card that failed (0-indexed)",
            example: 2,
          }),
          message: z.string().openapi({
            description: "Error message",
            example: "Invalid tile count",
          }),
        }),
      )
      .openapi({
        description: "Array of errors for failed cards",
      }),
  })
  .openapi("ImportResponse");

// Export TypeScript types
export type Tile = z.infer<typeof TileSchema>;
export type CardInput = z.infer<typeof CardInputSchema>;
export type CardUpdate = z.infer<typeof CardUpdateSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Ownership = z.infer<typeof OwnershipSchema>;
export type DeleteByCreator = z.infer<typeof DeleteByCreatorSchema>;
export type UpdateCreator = z.infer<typeof UpdateCreatorSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ImportRequest = z.infer<typeof ImportRequestSchema>;
export type ImportResponse = z.infer<typeof ImportResponseSchema>;
