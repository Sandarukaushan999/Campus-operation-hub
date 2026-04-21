# =========================================================
# Smart Campus Hub - Frontend Dockerfile (development mode)
# Runs Vite dev server with hot reload.
# =========================================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached.
# We copy only package files now and the source code later.
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the source code
COPY . .

# NOTE: this image runs as root. That is only acceptable because this
# Dockerfile is for the LOCAL DEV docker-compose stack (Vite dev server +
# bind-mounted host source + anonymous node_modules volume). A production
# frontend deployment should use a separate multi-stage Dockerfile that builds
# a static bundle and serves it via nginx as a non-root user.

EXPOSE 5173

# --host 0.0.0.0 is needed so the Vite server is reachable from outside the container.
# CHOKIDAR_USEPOLLING is set in docker-compose so file changes work on Windows volumes.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
