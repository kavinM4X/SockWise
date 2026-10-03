# Use Node.js LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set default production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests first for caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
