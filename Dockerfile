FROM node:18-alpine

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

EXPOSE 3000

CMD ["npm", "start"]
