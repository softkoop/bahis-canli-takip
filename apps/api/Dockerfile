# apps/api/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Package.json'ı kopyala
COPY package.json ./

# NPM ile install (legacy-peer-deps ile)
RUN npm install --legacy-peer-deps

# Source kopyala
COPY . .

# Build
RUN npm run build

# Data klasörü
RUN mkdir -p /app/data

# Database migration/push (drizzle)
RUN npm run db:push


# Her yerden erişim için host'u 0.0.0.0 yap
ENV HOST=0.0.0.0
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/src/main.js"]