# -------- Stage 1: Build frontend --------
FROM node:22 AS frontend-build
WORKDIR /app/frontend

# Copy only frontend files first for caching
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# -------- Stage 2: Setup backend --------
FROM node:22
WORKDIR /app

# Copy backend package.json and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build into backend/public (or wherever backend serves static files)
COPY --from=frontend-build /app/frontend/build ./backend/build

# Set working dir to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
