#!/bin/bash

# Build script for React Native Web app

echo "Building React Native Web app..."

# Install dependencies
npm install

# Build for web using Expo export
npm run web:build

echo "Build completed!"
echo "The built files are in the dist directory" 