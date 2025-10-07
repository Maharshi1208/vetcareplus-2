import type { OpenAPIV3 } from "openapi-types";

export const openapiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: { title: "VetCare+ API", version: "1.0.0" },
  servers: [
    { url: "http://localhost:4000" },
    { url: "http://localhost:4001" } // test server
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      OwnerBrief: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" }
        },
        required: ["id", "name"]
      },
      Appointment: {
        type: "object",
        properties: {
          id: { type: "string" },
          petId: { type: "string" },
          vetId: { type: "string" },
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["BOOKED", "CANCELLED", "COMPLETED"] },
          reason: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          // Convenience field on list/detail
          owner: {
            allOf: [{ $ref: "#/components/schemas/OwnerBrief" }],
            nullable: true
          }
        },
        required: ["id", "petId", "vetId", "start", "end", "status"]
      },
      ErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          error: {
            oneOf: [{ type: "string" }, { type: "object", additionalProperties: true }]
          }
        },
        required: ["ok", "error"]
      },
      AppointmentListResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          page: { type: "integer", minimum: 1, example: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 100, example: 20 },
          total: { type: "integer", example: 0 },
          totalPages: { type: "integer", example: 1 },
          hasPrev: { type: "boolean", example: false },
          hasNext: { type: "boolean", example: false },
          appointments: {
            type: "array",
            items: { $ref: "#/components/schemas/Appointment" }
          }
        },
        required: ["ok", "page", "pageSize", "total", "totalPages", "hasPrev", "hasNext", "appointments"]
      },
      AppointmentDetailResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          appointment: { $ref: "#/components/schemas/Appointment" }
        },
        required: ["ok", "appointment"]
      },
      // Requests
      AppointmentCreateRequest: {
        type: "object",
        properties: {
          petId: { type: "string" },
          vetId: { type: "string" },
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          reason: { type: "string" }
        },
        required: ["petId", "vetId", "start", "end"]
      },
      AppointmentRescheduleRequest: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" }
        },
        required: ["start", "end"]
      },
      AppointmentStatusRequest: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["BOOKED", "CANCELLED", "COMPLETED"] }
        },
        required: ["status"]
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/ping": {
      get: {
        summary: "Ping",
        responses: { "200": { description: "OK" } }
      }
    },

    // Auth
    "/auth/login": {
      post: {
        tags: ["Auth"],
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
                required: ["email", "password"]
              }
            }
          }
        },
        responses: { "200": { description: "JWT tokens" } }
      }
    },

    "/auth/request-reset": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string", format: "email" } },
                required: ["email"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Always OK (email may or may not exist)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                  required: ["ok"]
                }
              }
            }
          }
        }
      }
    },

    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 }
                },
                required: ["token", "password"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Password updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    message: { type: "string" }
                  },
                  required: ["ok", "message"]
                }
              }
            }
          },
          "400": {
            description: "Invalid token or password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },

    // Appointments
    "/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "List appointments (role scoped & paged)",
        description:
          "Admins see all; Vets see their own; Owners see their pets. `from`/`to` accept ISO 8601 or `YYYY-MM-DD`.",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { in: "query", name: "status", schema: { type: "string", enum: ["BOOKED", "CANCELLED", "COMPLETED"] } },
          {
            in: "query",
            name: "from",
            description: "ISO date-time or `YYYY-MM-DD` (inclusive)",
            schema: { oneOf: [{ type: "string", format: "date-time" }, { type: "string", format: "date" }] }
          },
          {
            in: "query",
            name: "to",
            description: "ISO date-time or `YYYY-MM-DD` (exclusive)",
            schema: { oneOf: [{ type: "string", format: "date-time" }, { type: "string", format: "date" }] }
          }
        ],
        responses: {
          "200": {
            description: "Paged results",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentListResponse" } } }
          },
          "400": {
            description: "Bad Request – invalid query (e.g., bad dates, negative page)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "429": { description: "Too Many Requests", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      },
      post: {
        tags: ["Appointments"],
        summary: "Book an appointment",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentCreateRequest" } } }
        },
        responses: {
          "201": {
            description: "Appointment created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } }
          },
          "400": { description: "Validation error / archived pet / invalid dates", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden (pet not owned)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Pet or Vet not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Outside availability / conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment details (role scoped)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}/reschedule": {
      patch: {
        tags: ["Appointments"],
        summary: "Reschedule an appointment",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentRescheduleRequest" } } }
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } } },
          "400": { description: "Invalid dates / not BOOKED", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Outside availability / conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}/cancel": {
      patch: {
        tags: ["Appointments"],
        summary: "Cancel an appointment",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Cancelled",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    appointment: {
                      type: "object",
                      properties: { id: { type: "string" }, status: { type: "string", enum: ["CANCELLED"] } },
                      required: ["id", "status"]
                    }
                  },
                  required: ["ok", "appointment"]
                }
              }
            }
          },
          "400": { description: "Only BOOKED can be cancelled", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}/restore": {
      patch: {
        tags: ["Appointments"],
        summary: "Restore a cancelled appointment",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Restored", content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } } },
          "400": { description: "Only CANCELLED can be restored", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Outside availability / time slot no longer available", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}/status": {
      post: {
        tags: ["Appointments"],
        summary: "Generic status update (admin & scoped rules apply)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentStatusRequest" } } }
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } } },
          "400": { description: "Unsupported transition / missing payment / invalid", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Outside availability / conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    },

    "/appointments/{id}/complete": {
      patch: {
        tags: ["Appointments"],
        summary: "Complete an appointment (ADMIN only, requires SUCCESS payment)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Completed", content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentDetailResponse" } } } },
          "400": { description: "Only BOOKED can be completed / missing payment", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Admin only", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        },
        security: [{ bearerAuth: [] }]
      }
    }
  }
};

export function getSpec() {
  return openapiSpec;
}
