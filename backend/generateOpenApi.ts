import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import yaml from "yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import schemas
import {
  CardInputSchema,
  CardUpdateSchema,
  CardSchema,
  OwnershipSchema,
  DeleteByCreatorSchema,
  UpdateCreatorSchema,
} from "./schemas/card.js";
import {
  PeerRegistrationSchema,
  PeerInfoSchema,
  PeerHeartbeatSchema,
  PeerListResponseSchema,
  PeerSuccessResponseSchema,
} from "./schemas/peer.js";
import {
  ErrorSchema,
  SuccessMessageSchema,
  DeleteResponseSchema,
  UpdateResponseSchema,
  HealthCheckSchema,
  StatusSchema,
  CardStatsSchema,
  MongoIdParamSchema,
  CardIdParamSchema,
  PeerIdParamSchema,
  ExcludePeerIdQuerySchema,
  CreatorQuerySchema,
  UserIdQuerySchema,
} from "./schemas/common.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create registry
const registry = new OpenAPIRegistry();

// Register all schemas
registry.register("Card", CardSchema);
registry.register("CardInput", CardInputSchema);
registry.register("CardUpdate", CardUpdateSchema);
registry.register("PeerInfo", PeerInfoSchema);
registry.register("PeerRegistration", PeerRegistrationSchema);
registry.register("Error", ErrorSchema);

// Common responses
const errorResponses = {
  400: {
    description: "Invalid request parameters or validation failed",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
  },
  403: {
    description: "Access forbidden (not the owner or card is published)",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
  },
  404: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
  },
  429: {
    description: "Rate limit exceeded",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
    headers: z.object({
      "RateLimit-Limit": z
        .number()
        .int()
        .openapi({ description: "Maximum requests allowed" }),
      "RateLimit-Remaining": z
        .number()
        .int()
        .openapi({ description: "Requests remaining" }),
      "RateLimit-Reset": z
        .number()
        .int()
        .openapi({ description: "Time when limit resets (Unix timestamp)" }),
    }),
  },
  500: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: ErrorSchema,
      },
    },
  },
};

// ==================== CARD ENDPOINTS ====================

// GET /api/cards - List all cards
registry.registerPath({
  method: "get",
  path: "/api/cards",
  summary: "List all cards",
  description:
    "Retrieve all bingo cards sorted by creation date (newest first). Rate limited to prevent scraping.",
  tags: ["cards"],
  request: {
    query: z.object({
      userId: UserIdQuerySchema,
    }),
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: z.array(CardSchema),
        },
      },
    },
    429: errorResponses[429],
    500: errorResponses[500],
  },
});

// POST /api/cards - Create card
registry.registerPath({
  method: "post",
  path: "/api/cards",
  summary: "Create a new card",
  description:
    "Create a new bingo card with specified grid size and tiles. Stricter rate limits apply.",
  tags: ["cards"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CardInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Card created successfully",
      content: {
        "application/json": {
          schema: CardSchema,
        },
      },
    },
    400: errorResponses[400],
    429: errorResponses[429],
  },
});

// GET /api/cards/stats/counts - Get card statistics
registry.registerPath({
  method: "get",
  path: "/api/cards/stats/counts",
  summary: "Get card statistics",
  description:
    "Retrieve counts of published and unpublished cards, along with system limits. Rate limited to prevent abuse.",
  tags: ["cards"],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: CardStatsSchema,
        },
      },
    },
    429: errorResponses[429],
    500: errorResponses[500],
  },
});

// GET /api/cards/{id} - Get single card
registry.registerPath({
  method: "get",
  path: "/api/cards/{id}",
  summary: "Get a single card",
  description: "Retrieve a specific bingo card by its ID",
  tags: ["cards"],
  request: {
    params: z.object({ id: MongoIdParamSchema }),
    query: z.object({
      userId: UserIdQuerySchema,
    }),
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: CardSchema,
        },
      },
    },
    404: errorResponses[404],
    500: errorResponses[500],
  },
});

// PUT /api/cards/{id} - Update card
registry.registerPath({
  method: "put",
  path: "/api/cards/{id}",
  summary: "Update a card",
  description: "Update an unpublished card. Published cards cannot be edited.",
  tags: ["cards"],
  request: {
    params: z.object({ id: MongoIdParamSchema }),
    body: {
      content: {
        "application/json": {
          schema: CardUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Card updated successfully",
      content: {
        "application/json": {
          schema: CardSchema,
        },
      },
    },
    400: errorResponses[400],
    403: errorResponses[403],
    404: errorResponses[404],
    429: errorResponses[429],
  },
});

// DELETE /api/cards/{id} - Delete card
registry.registerPath({
  method: "delete",
  path: "/api/cards/{id}",
  summary: "Delete a card",
  description: "Delete an unpublished card. Published cards cannot be deleted.",
  tags: ["cards"],
  request: {
    params: z.object({ id: MongoIdParamSchema }),
    query: z.object({ createdBy: CreatorQuerySchema }),
  },
  responses: {
    200: {
      description: "Card deleted successfully",
      content: {
        "application/json": {
          schema: SuccessMessageSchema,
        },
      },
    },
    403: errorResponses[403],
    404: errorResponses[404],
    429: errorResponses[429],
  },
});

// POST /api/cards/{id}/publish - Publish card
registry.registerPath({
  method: "post",
  path: "/api/cards/{id}/publish",
  summary: "Publish a card",
  description: "Publish a card to make it playable. All tiles must be filled.",
  tags: ["cards"],
  request: {
    params: z.object({ id: MongoIdParamSchema }),
    body: {
      content: {
        "application/json": {
          schema: OwnershipSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Card published successfully",
      content: {
        "application/json": {
          schema: CardSchema,
        },
      },
    },
    400: errorResponses[400],
    403: errorResponses[403],
    404: errorResponses[404],
    429: errorResponses[429],
  },
});

// POST /api/cards/{id}/unpublish - Unpublish card
registry.registerPath({
  method: "post",
  path: "/api/cards/{id}/unpublish",
  summary: "Unpublish a card",
  description: "Unpublish a card to make it editable again",
  tags: ["cards"],
  request: {
    params: z.object({ id: MongoIdParamSchema }),
    body: {
      content: {
        "application/json": {
          schema: OwnershipSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Card unpublished successfully",
      content: {
        "application/json": {
          schema: CardSchema,
        },
      },
    },
    400: errorResponses[400],
    403: errorResponses[403],
    404: errorResponses[404],
    429: errorResponses[429],
  },
});

// POST /api/cards/delete-by-creator - Delete cards by creator
registry.registerPath({
  method: "post",
  path: "/api/cards/delete-by-creator",
  summary: "Delete all cards by creator",
  description: "Delete all cards created by a specific user",
  tags: ["cards"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: DeleteByCreatorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Cards deleted successfully",
      content: {
        "application/json": {
          schema: DeleteResponseSchema,
        },
      },
    },
    400: errorResponses[400],
    429: errorResponses[429],
  },
});

// POST /api/cards/update-creator - Update creator name
registry.registerPath({
  method: "post",
  path: "/api/cards/update-creator",
  summary: "Update creator name",
  description: "Update creator name for all cards with the old name",
  tags: ["cards"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateCreatorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Creator name updated successfully",
      content: {
        "application/json": {
          schema: UpdateResponseSchema,
        },
      },
    },
    400: errorResponses[400],
    429: errorResponses[429],
  },
});

// ==================== PEER ENDPOINTS ====================

// POST /api/peers/{cardId}/register - Register peer
registry.registerPath({
  method: "post",
  path: "/api/peers/{cardId}/register",
  summary: "Register or update a peer",
  description:
    "Register a player as an active peer for a card or update their information",
  tags: ["peers"],
  request: {
    params: z.object({ cardId: CardIdParamSchema }),
    body: {
      content: {
        "application/json": {
          schema: PeerRegistrationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Peer registered successfully",
      content: {
        "application/json": {
          schema: PeerSuccessResponseSchema,
        },
      },
    },
    400: errorResponses[400],
    429: {
      description: "Rate limit exceeded or max peers reached",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

// GET /api/peers/{cardId}/peers - Get active peers
registry.registerPath({
  method: "get",
  path: "/api/peers/{cardId}/peers",
  summary: "Get active peers",
  description: "Retrieve list of active peers for a card",
  tags: ["peers"],
  request: {
    params: z.object({ cardId: CardIdParamSchema }),
    query: z.object({ excludePeerId: ExcludePeerIdQuerySchema }),
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: PeerListResponseSchema,
        },
      },
    },
    429: errorResponses[429],
  },
});

// POST /api/peers/{cardId}/heartbeat/{peerId} - Heartbeat
registry.registerPath({
  method: "post",
  path: "/api/peers/{cardId}/heartbeat/{peerId}",
  summary: "Send peer heartbeat",
  description: "Keep peer connection alive and update checked count",
  tags: ["peers"],
  request: {
    params: z.object({
      cardId: CardIdParamSchema,
      peerId: PeerIdParamSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: PeerHeartbeatSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Heartbeat successful",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    404: errorResponses[404],
    429: errorResponses[429],
  },
});

// DELETE /api/peers/{cardId}/unregister/{peerId} - Unregister peer
registry.registerPath({
  method: "delete",
  path: "/api/peers/{cardId}/unregister/{peerId}",
  summary: "Unregister a peer",
  description: "Remove a peer from the active peer list (when leaving)",
  tags: ["peers"],
  request: {
    params: z.object({
      cardId: CardIdParamSchema,
      peerId: PeerIdParamSchema,
    }),
  },
  responses: {
    200: {
      description: "Peer unregistered successfully",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    429: errorResponses[429],
  },
});

// ==================== HEALTH CHECK ====================

// GET /api/health - Health check
registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  description: "Check if the API is running",
  tags: ["health"],
  responses: {
    200: {
      description: "API is healthy",
      content: {
        "application/json": {
          schema: HealthCheckSchema,
        },
      },
    },
  },
});

// GET /api/status - Detailed status check
registry.registerPath({
  method: "get",
  path: "/api/status",
  summary: "System status",
  description:
    "Get detailed system status including database connectivity, uptime, and version information",
  tags: ["health"],
  responses: {
    200: {
      description: "System is healthy",
      content: {
        "application/json": {
          schema: StatusSchema,
        },
      },
    },
    503: {
      description: "System is degraded (e.g., database connection issue)",
      content: {
        "application/json": {
          schema: StatusSchema,
        },
      },
    },
  },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Bingo Builder API",
    description: `RESTful API for creating, managing, and playing multiplayer bingo cards.

**Security Features:**
- CORS protection with origin restriction
- Multi-tier rate limiting (API, write, peer, list operations)
- Request validation via OpenAPI specification (auto-generated from Zod schemas)
- Request body size limits (1MB)

**Note:** This OpenAPI specification is automatically generated from Zod schemas.
Do not edit this file manually. Instead, update the schemas in \`backend/schemas/\` and regenerate.`,
    version: "1.0.0",
    contact: {
      name: "Bingo Builder",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "http://localhost:3002",
      description: "Test server",
    },
  ],
  tags: [
    {
      name: "cards",
      description: "Bingo card management",
    },
    {
      name: "peers",
      description: "Multiplayer peer synchronization",
    },
    {
      name: "health",
      description: "Health check",
    },
  ],
});

// Write to file
const outputPath = path.join(__dirname, "openapi.yaml");
fs.writeFileSync(outputPath, yaml.stringify(document, { indent: 2 }));

console.log("✅ OpenAPI specification generated successfully!");
console.log(`📄 File: ${outputPath}`);
