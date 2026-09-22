# LEVEL: ADVANCED → multi-stage build: compile the React app in a Node image,
# then serve only the static build output from a lightweight Nginx image.
# This keeps the final image small (no node_modules shipped to production).

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
