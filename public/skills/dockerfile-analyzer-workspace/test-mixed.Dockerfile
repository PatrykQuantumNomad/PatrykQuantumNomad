FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20 AS build
WORKDIR /app
COPY --from=0 /app/dist ./dist
COPY --from=0 /app/node_modules ./node_modules
run npm prune --production
ENV NODE_ENV production
ENV MY_VAR some value with spaces
EXPOSE 3000
ENTRYPOINT ["node", "dist/server.js"]
ENTRYPOINT ["npm", "start"]
CMD ["node", "server.js"]
CMD ["npm", "run", "start"]
