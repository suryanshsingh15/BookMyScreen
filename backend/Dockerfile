# LEVEL: ADVANCED → "Containerized the application using Docker" (resume)
FROM node:20-alpine

WORKDIR /app

# Copy only package files first so Docker can cache the npm install layer
# and skip reinstalling dependencies when only source code changes.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
