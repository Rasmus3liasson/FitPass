# Use Node.js 20 for compatibility with latest supabase-js
FROM node:20

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Install dependencies (force to handle lockfile version)
RUN pnpm install --force

# Build backend (adjust path if needed)
RUN pnpm --filter fitpass-backend... build

# Expose backend port
EXPOSE 3001

# Start backend
CMD ["pnpm", "--filter", "fitpass-backend...", "start"]
