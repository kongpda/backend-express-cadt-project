FROM node:23.3.0-alpine

# Create app directory and set ownership
WORKDIR /app

# Create node_modules directory and set ownership
RUN mkdir -p /app/node_modules && chown -R node:node /app

# Switch to non-root user
USER node

# Copy package files with correct ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/

# Install dependencies as non-root user
RUN npm install

# Copy app source with correct ownership
COPY --chown=node:node . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
