FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies, including TypeScript as a dev dependency
RUN npm install
RUN npm install typescript --save-dev

# Copy TypeScript configuration and source files
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript
RUN tsc

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]