FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and CA certificates for Prisma and secure connections
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.14.0

COPY package.json pnpm-workspace.yaml .npmrc* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --filter @recruitment/shared --filter backend

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared library
RUN pnpm --filter @recruitment/shared build

# Generate Prisma Client and compile NestJS
WORKDIR /app/apps/backend
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN pnpm db:generate
RUN pnpm build

# Ensure upload directory exists
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 4000

CMD ["sh", "-c", "pnpm db:push --accept-data-loss || true ; pnpm db:seed || true ; node dist/main.js"]
