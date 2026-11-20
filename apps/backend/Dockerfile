FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and dependencies
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

EXPOSE 4000

CMD ["sh", "-c", "pnpm db:push && ts-node prisma/seed.ts ; node dist/main.js"]
