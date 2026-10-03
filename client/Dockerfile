# ==========================================
# Stage 1: Build React + Vite static bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time argument for API base URL (defaults to /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy dependency manifests
COPY package*.json ./

# Install dependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Production Nginx web server
# ==========================================
FROM nginx:alpine

# Remove default Nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure Nginx for Single Page Application (SPA) routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
