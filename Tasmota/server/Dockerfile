FROM oven/bun:alpine

WORKDIR /app

COPY package*.json ./
# COPY bun.lockb* ./

# RUN bun install

COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript (uncomment when switching to JS)
# RUN bun build ./src/index.ts --outdir dist --target bun

EXPOSE 3000

# Run TypeScript directly
CMD ["bun", "src/index.ts"]

# Run compiled JavaScript (uncomment when switching to JS)
# CMD ["bun", "dist/index.js"]