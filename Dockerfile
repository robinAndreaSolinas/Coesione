FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV VITE_API_URL=/api/v1
RUN npm run build-only

FROM node:22-alpine AS backend

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY --from=backend /app/package.json /app/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/dist ./static

EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/index.js"]
