FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port 5173
EXPOSE 5173

# Run the development server with host 0.0.0.0 for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
