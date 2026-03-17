FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN NODE_ENV=development npm ci
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/server packages/server
RUN cd packages/shared && npx tsc --project tsconfig.json && cd ../..
RUN cd packages/server && npx tsc --skipLibCheck && cd ../..

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/package.json packages/server/
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/server/src/core/database/migrations packages/server/src/core/database/migrations
RUN npm ci --workspace=packages/shared --workspace=packages/server --omit=dev
EXPOSE 3000
CMD ["node", "packages/server/dist/server.js"]
