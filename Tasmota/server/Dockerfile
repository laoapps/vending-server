FROM oven/bun:latest AS base
FROM base AS install

ENV NODE_ENV $NODE_ENV
WORKDIR /app
COPY package.json /app

COPY package-lock.json /app/package-lock.json
# RUN npm install
# RUN npm install typescript -g
COPY . /app



# RUN mkdir -p /temp/prod
# COPY package.json bun.lockb /temp/prod/
# RUN cd /temp/prod && bun install --frozen-lockfile --production




# FROM base AS release
# COPY --from=install /temp/prod/node_modules node_modules
# COPY --from=prerelease /app/index.ts .
# COPY --from=prerelease /app/package.json .
USER bun


EXPOSE 3000

# Run TypeScript directly
CMD ["bun", "src/index.ts"]

# Run compiled JavaScript (uncomment when switching to JS)
# CMD ["bun", "dist/index.js"]