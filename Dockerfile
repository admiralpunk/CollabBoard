FROM node:20-alpine

# Install build dependencies for native modules if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files from the backend folder
COPY backend/package*.json ./

# Install backend dependencies cleanly
RUN npm ci

# Copy the rest of the backend source code
COPY backend/ .

EXPOSE 3000

CMD ["node", "src/server.js"]