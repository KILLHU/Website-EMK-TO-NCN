#!/bin/bash

# Update package list and install prerequisites
sudo apt-get update
sudo apt-get install -y curl

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing..."
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Create necessary directories
mkdir -p uploads output

# Install dependencies
npm install express multer archiver

# Start the server
node index.js
