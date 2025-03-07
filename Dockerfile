# Gunakan image Node.js versi 23-alpine
FROM node:23-alpine

WORKDIR /app

# Salin file package dan install dependencies
COPY package*.json ./
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Build aplikasi NextJS
RUN npm run build

EXPOSE 3000

# Jalankan seed script lalu start aplikasi
CMD ["npm", "start"]