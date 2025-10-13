# Step 1: Use Node base image with alpine linux
FROM node:20.15.0-alpine

# Step 2: Create app directory inside container
WORKDIR /use/src/app

# Step 3: Copy package.json and install dependencies(exclude dev dependecies)
COPY package*.json ./
RUN npm ci --only=production

# Step 4: Copy rest of the files
COPY . .

# Step 5: Expose port 3000
EXPOSE 3000

# Step 6: Start the app
CMD ["node" , "src/server.js"]
