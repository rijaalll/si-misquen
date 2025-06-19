FROM node:18-alpine
WORKDIR /app
COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

# PORT
EXPOSE 4321

# RUN the application
CMD ["npm", "run", "dev"]