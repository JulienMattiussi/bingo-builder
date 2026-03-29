import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Error Response Schema
 */
export const ErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "Card not found",
    }),
    errors: z
      .array(
        z.object({
          path: z.string().optional(),
          message: z.string(),
          errorCode: z.string().optional(),
        }),
      )
      .optional()
      .openapi({
        description: "Detailed validation errors (for 400 responses)",
      }),
  })
  .openapi("Error");

/**
 * Success Message Schema
 */
export const SuccessMessageSchema = z
  .object({
    message: z.string().openapi({
      description: "Success message",
    }),
  })
  .openapi("SuccessMessage");

/**
 * Delete Response Schema
 */
export const DeleteResponseSchema = z
  .object({
    message: z.string(),
    deletedCount: z.number().int().openapi({
      description: "Number of deleted items",
    }),
  })
  .openapi("DeleteResponse");

/**
 * Update Response Schema
 */
export const UpdateResponseSchema = z
  .object({
    message: z.string(),
    modifiedCount: z.number().int().openapi({
      description: "Number of modified items",
    }),
  })
  .openapi("UpdateResponse");

/**
 * Health Check Response Schema
 */
export const HealthCheckSchema = z
  .object({
    status: z.literal("ok").openapi({
      description: "Health status",
    }),
  })
  .openapi("HealthCheck");

/**
 * Status Response Schema
 */
export const StatusSchema = z
  .object({
    status: z.enum(["ok", "degraded"]).openapi({
      description: "Overall system status",
      example: "ok",
    }),
    timestamp: z.string().openapi({
      description: "Current timestamp (ISO 8601)",
      example: "2024-03-24T10:30:00.000Z",
    }),
    uptime: z.number().openapi({
      description: "Server uptime in seconds",
      example: 3600.5,
    }),
    environment: z.string().openapi({
      description: "Current environment",
      example: "development",
    }),
    database: z
      .object({
        status: z
          .enum(["connected", "connecting", "disconnecting", "disconnected"])
          .openapi({
            description: "Database connection status",
          }),
        name: z.string().openapi({
          description: "Database name",
          example: "bingo-builder",
        }),
        host: z.string().openapi({
          description: "Database host",
          example: "localhost:27017",
        }),
      })
      .openapi({
        description: "Database connection information",
      }),
    version: z.string().openapi({
      description: "API version",
      example: "1.0.0",
    }),
  })
  .openapi("Status");

/**
 * Card Statistics Response Schema
 */
export const CardStatsSchema = z
  .object({
    published: z.number().int().openapi({
      description: "Number of published cards",
      example: 10,
    }),
    unpublished: z.number().int().openapi({
      description: "Number of unpublished cards",
      example: 5,
    }),
    maxPublished: z.number().int().openapi({
      description: "Maximum allowed published cards",
      example: 50,
    }),
    maxUnpublished: z.number().int().openapi({
      description: "Maximum allowed unpublished cards",
      example: 50,
    }),
    canCreate: z.boolean().openapi({
      description: "Whether user can create new cards",
      example: true,
    }),
    canPublish: z.boolean().openapi({
      description: "Whether user can publish more cards",
      example: true,
    }),
  })
  .openapi("CardStats");

/**
 * MongoDB ObjectId Parameter Schema
 */
export const MongoIdParamSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
  .openapi({
    param: {
      name: "id",
      in: "path",
    },
    description: "MongoDB ObjectId",
    example: "507f1f77bcf86cd799439011",
  });

/**
 * Card ID Parameter Schema (for peer routes)
 */
export const CardIdParamSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
  .openapi({
    param: {
      name: "cardId",
      in: "path",
    },
    description: "MongoDB ObjectId of the card",
    example: "507f1f77bcf86cd799439011",
  });

/**
 * Peer ID Parameter Schema
 */
export const PeerIdParamSchema = z
  .string()
  .uuid("Invalid UUID")
  .openapi({
    param: {
      name: "peerId",
      in: "path",
    },
    description: "UUID of the peer",
    example: "550e8400-e29b-41d4-a716-446655440000",
  });

/**
 * Exclude Peer ID Query Parameter
 */
export const ExcludePeerIdQuerySchema = z
  .string()
  .uuid()
  .optional()
  .openapi({
    param: {
      name: "excludePeerId",
      in: "query",
    },
    description:
      "Peer ID to exclude from results (usually the requesting peer)",
  });

/**
 * Creator Name Query Parameter
 */
export const CreatorQuerySchema = z
  .string()
  .optional()
  .openapi({
    param: {
      name: "createdBy",
      in: "query",
    },
    description: "Creator name for ownership verification",
  });

/**
 * User ID Query Parameter
 * Used to determine card ownership (isOwner flag in responses)
 */
export const UserIdQuerySchema = z
  .string()
  .uuid()
  .optional()
  .openapi({
    param: {
      name: "userId",
      in: "query",
    },
    description: "User ID for ownership verification (UUID v4)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  });

// Export TypeScript types
export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;
export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;
export type UpdateResponse = z.infer<typeof UpdateResponseSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
