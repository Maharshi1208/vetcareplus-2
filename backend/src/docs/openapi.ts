// src/docs/openapi.ts
import type { OpenAPIV3_1 } from "openapi-types";

export function getSpec(origin: string): OpenAPIV3_1.Document {
  const doc: OpenAPIV3_1.Document = {
    openapi: "3.1.0",
    info: {
      title: "VetCare+ API",
      version: "1.0.0",
      description:
        "Internal API for VetCare+ (auth, pets, vets, appointments, reports, payments).",
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Pet: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            species: { type: "string", nullable: true },
            breed: { type: "string", nullable: true },
            dob: { type: "string", format: "date-time", nullable: true },
            archived: { type: "boolean" },
            ownerId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Vet: {
          type: "object",
          required: ["id", "name", "active"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email", nullable: true },
            phone: { type: "string", nullable: true },
            specialty: { type: "string", nullable: true },
            bio: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        Appointment: {
          type: "object",
          required: ["id", "petId", "vetId", "start", "end", "status"],
          properties: {
            id: { type: "string" },
            petId: { type: "string" },
            vetId: { type: "string" },
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["BOOKED", "CANCELLED", "COMPLETED"],
            },
            reason: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/ping": {
        get: {
          summary: "Health ping",
          responses: {
            200: {
              description: "pong",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "pong"],
                    properties: {
                      ok: { type: "boolean" },
                      pong: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/auth/login": {
        post: {
          summary: "Login and receive access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Logged in",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      user: {
                        type: "object",
                        properties: {
                          email: { type: "string" },
                          role: {
                            type: "string",
                            enum: ["OWNER", "VET", "ADMIN"],
                          },
                        },
                      },
                      tokens: {
                        type: "object",
                        properties: { access: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/pets": {
        get: {
          summary: "List my pets",
          responses: {
            200: {
              description: "Pets",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      pets: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Pet" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a pet",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    species: { type: "string" },
                    breed: { type: "string" },
                    dob: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      pet: { $ref: "#/components/schemas/Pet" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/appointments": {
        get: {
          summary: "List appointments (paged, admin sees all)",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["BOOKED", "CANCELLED", "COMPLETED"],
              },
            },
            { name: "from", in: "query", schema: { type: "string" } },
            { name: "to", in: "query", schema: { type: "string" } },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "pageSize",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
            },
          ],
          responses: {
            200: {
              description: "Paged appointments",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      page: { type: "integer" },
                      pageSize: { type: "integer" },
                      total: { type: "integer" },
                      appointments: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Appointment" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return doc;
}
