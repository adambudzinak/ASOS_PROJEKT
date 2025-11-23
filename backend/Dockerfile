FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .

RUN npm run build

RUN npx prisma generate

RUN mkdir -p /app/uploads

EXPOSE 8080

CMD ["npm", "start"]
