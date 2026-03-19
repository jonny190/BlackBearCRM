FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN NODE_ENV=development npm ci && npm install @rollup/rollup-linux-x64-musl --no-save
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/client packages/client
ARG CACHE_BUST=1
RUN echo "build: $CACHE_BUST" && cd packages/shared && npx tsc --project tsconfig.json && cd ../..
RUN cd packages/client && npx vite build && cd ../..

FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
