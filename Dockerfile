FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG PUBLIC_DISABLE_OPFS=false
ENV PUBLIC_DISABLE_OPFS=$PUBLIC_DISABLE_OPFS
RUN npm run build
RUN npm prune --production

FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/server.js server.js
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "server.js" ]
