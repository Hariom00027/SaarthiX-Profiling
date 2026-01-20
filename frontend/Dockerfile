# Use Node 20 as base image (required for react-router-dom@7.10.1)
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Accept build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:9090
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with retry logic for network issues
RUN npm ci --prefer-offline --no-audit || \
    (sleep 5 && npm ci --prefer-offline --no-audit) || \
    (sleep 10 && npm ci --prefer-offline --no-audit)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder stage to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

