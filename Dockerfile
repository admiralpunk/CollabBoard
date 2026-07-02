FROM node:20-alpine

# Install essential dependencies for native modules (like @roamhq/wrtc compilation flags)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy the package files directly from the backend directory to the container root
COPY backend/package*.json ./

# Clean installation of dependencies
RUN npm ci

# Copy the actual server source code from the backend folder
COPY backend/ .

# Expose the internal port matching your environment variables
EXPOSE 3000

# Start the application using your backend's startup sequence
CMD ["node", "src/server.js"]
