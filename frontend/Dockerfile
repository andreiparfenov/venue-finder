# Stage 1 — build the Vite bundle
# VITE_GOOGLE_MAPS_KEY must be passed as a build arg because Vite
# bakes env vars into the bundle at compile time, not runtime.
FROM node:18-alpine AS builder
WORKDIR /app
ARG VITE_GOOGLE_MAPS_KEY
ARG VITE_API_URL
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve with nginx + proxy /api to backend
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Store as a template so envsubst can inject Railway's $PORT at container start
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
