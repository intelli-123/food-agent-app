# 1. Use an official lightweight Node.js image
FROM node:20-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first (better caching)
COPY package*.json ./

# 4. Install dependencies
# We use --omit=dev to keep the image small
RUN npm install --omit=dev

# 5. Copy the rest of the application code
COPY . .

# 6. Create the uploads directory manually (since it's ignored)
RUN mkdir -p uploads

# 7. Expose the port the app runs on
EXPOSE 3000

# 8. Define the command to run the app
CMD ["npm", "start"]