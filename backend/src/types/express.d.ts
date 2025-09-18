import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    // payload from JWT (see middleware/auth)
    user?: any;
  }
}
