#!/bin/bash

echo "🧪 Testing build process..."

# Test backend build
echo "📦 Testing backend build..."
cd server
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Backend dependencies installation failed"
    exit 1
fi

# Test frontend build
echo "📦 Testing frontend build..."
cd ..
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Frontend dependencies installation failed"
    exit 1
fi

# Test web build
echo "🌐 Testing web build..."
npm run web:build
if [ $? -eq 0 ]; then
    echo "✅ Web build completed successfully"
    echo "📁 Build files are in the dist directory"
else
    echo "❌ Web build failed"
    exit 1
fi

echo "🎉 All build tests passed!"
echo "🚀 Ready for deployment to Render" 