# ------------ Build stage ------------
FROM node:22-alpine AS build
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# source (includes prisma/, src/, etc.)
COPY . .

# compile TS -> JS
RUN npm run build

# ------------ Runtime stage ------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# 1) package manifests
COPY package*.json ./

# 2) prisma schema BEFORE npm ci so @prisma/client postinstall can generate
COPY prisma ./prisma

# 3) install prod deps (runs @prisma/client postinstall -> generate)
RUN npm ci --omit=dev

# 4) compiled JS
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
