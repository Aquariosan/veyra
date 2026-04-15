FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc
RUN npm prune --production
ENV PORT=4200
EXPOSE 4200
CMD ["node", "dist/index.js"]
