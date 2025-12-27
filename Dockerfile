FROM node:23.9-alpine

WORKDIR /app

COPY . .    

RUN npm i
CMD ["node", "src/index.ts"]
