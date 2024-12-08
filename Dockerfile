FROM node:23.3.0-alpine

# Add node user for better security
USER node

# Create app directory and set ownership
WORKDIR /home/node/app

# Copy package files as node user
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy app source with correct ownership
COPY --chown=node:node . .

# Add a healthcheck (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
