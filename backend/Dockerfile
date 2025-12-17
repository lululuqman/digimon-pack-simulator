FROM oven/bun:1 as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 10000

# Start the app
CMD ["bun", "run", "src/index.ts"]