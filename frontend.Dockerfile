FROM node:20-alpine
WORKDIR /app

# Copy only dependency manifests first for caching
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy the rest (or just frontend/ if that’s what Vite uses)
COPY . .

EXPOSE 5173
CMD ["sh", "-lc", "npm run dev -- --host 0.0.0.0"]

