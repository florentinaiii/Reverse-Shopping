// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const recipeRoutes = require('./routes/recipeRoute');
const savedRecipeRoutes = require('./routes/savedRecipeRoute');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));
console.log(`Serving images from: ${path.join(__dirname, 'images')}`);

// Connect to MongoDB
connectDB();

// Routes
app.use('/recipes', recipeRoutes);
app.use('/saved-recipes', savedRecipeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Recipe API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
