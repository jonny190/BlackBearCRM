FROM node:20-alpine AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN NODE_ENV=development npm ci
COPY packages/shared packages/shared
COPY packages/client packages/client
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/client

FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
