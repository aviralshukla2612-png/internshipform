FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@12.14.0

COPY package.json pnpm-workspace.yaml .npmrc* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --filter @recruitment/shared --filter frontend

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN pnpm --filter @recruitment/shared build

WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
