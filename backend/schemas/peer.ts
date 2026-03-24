import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import config from "../config/config.js";

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Peer Registration Schema
 */
export const PeerRegistrationSchema = z
  .object({
    peerId: z.string().uuid("Peer ID must be a valid UUID").openapi({
      description: "Unique peer identifier (client-generated UUID)",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    playerName: z
      .string()
      .min(1, "Player nickname is required")
      .max(config.get("limits.playerNameMaxLength"))
      .openapi({
        description: "Player nickname",
        example: "Alice",
      }),
    checkedCount: z.number().int().min(0).default(0).openapi({
      description: "Number of tiles checked by this player",
      example: 0,
    }),
  })
  .openapi("PeerRegistration");

/**
 * Peer Info Schema - Response format
 */
export const PeerInfoSchema = z
  .object({
    peerId: z.string().uuid().openapi({
      description: "Unique peer identifier",
    }),
    playerName: z.string().openapi({
      description: "Player nickname",
    }),
    checkedCount: z.number().int().min(0).openapi({
      description: "Number of tiles checked",
    }),
  })
  .openapi("PeerInfo");

/**
 * Peer Heartbeat Schema
 */
export const PeerHeartbeatSchema = z
  .object({
    checkedCount: z.number().int().min(0).optional().openapi({
      description: "Updated checked count",
    }),
  })
  .openapi("PeerHeartbeat");

/**
 * Peer List Response Schema
 */
export const PeerListResponseSchema = z
  .object({
    peers: z.array(PeerInfoSchema).openapi({
      description: "List of active peers",
    }),
  })
  .openapi("PeerListResponse");

/**
 * Peer Success Response Schema
 */
export const PeerSuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Operation success status",
    }),
    activePeerCount: z.number().int().optional().openapi({
      description: "Number of active peers for this card",
    }),
  })
  .openapi("PeerSuccessResponse");

// Export TypeScript types
export type PeerRegistration = z.infer<typeof PeerRegistrationSchema>;
export type PeerInfo = z.infer<typeof PeerInfoSchema>;
export type PeerHeartbeat = z.infer<typeof PeerHeartbeatSchema>;
export type PeerListResponse = z.infer<typeof PeerListResponseSchema>;
export type PeerSuccessResponse = z.infer<typeof PeerSuccessResponseSchema>;
