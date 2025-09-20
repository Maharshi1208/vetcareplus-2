import type { OpenAPIV3 } from "openapi-types";

export const openapiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: { title: "VetCare+ API", version: "1.0.0" },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Appointment: {
        type: "object",
        properties: {
          id: { type: "string" },
          petId: { type: "string" },
          vetId: { type: "string" },
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["BOOKED","CANCELLED","COMPLETED"] },
          reason: { type: "string", nullable: true },
          notes: { type: "string", nullable: true }
        },
        required: ["id","petId","vetId","start","end","status"]
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/ping": { get: { summary: "Ping", responses: { "200": { description: "OK" } } } },
// inside paths: { ... }
'/auth/request-reset': {
  post: {
    tags: ['Auth'],
    summary: 'Request password reset',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { email: { type: 'string', format: 'email' } },
            required: ['email'],
          },
        },
      },
    },
    responses: {
      200: { description: 'Always OK (email may or may not exist)', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
    },
  },
},
'/auth/reset-password': {
  post: {
    tags: ['Auth'],
    summary: 'Reset password with token',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              password: { type: 'string', minLength: 8 },
            },
            required: ['token', 'password'],
          },
        },
      },
    },
    responses: {
      200: { description: 'Password updated', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } } } } },
      400: { description: 'Invalid token or password' },
    },
  },
},


    "/auth/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                },
                required: ["email","password"]
              }
            }
          }
        },
        responses: { "200": { description: "JWT tokens" } }
      }
    },
    "/appointments": {
      get: {
        summary: "List appointments",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { in: "query", name: "status", schema: { type: "string", enum: ["BOOKED","CANCELLED","COMPLETED"] } },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } }
        ],
        responses: {
          "200": {
            description: "Paged results",
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
                      items: { $ref: "#/components/schemas/Appointment" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export function getSpec() {
  return openapiSpec;
}
