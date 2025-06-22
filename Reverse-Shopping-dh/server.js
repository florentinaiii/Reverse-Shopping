const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/recipeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Recipe Schema
const recetaSchema = new mongoose.Schema({
  id: String,
  name: String,
  perberesit: [String], // ingredients in Albanian
  instructions: String,
  image: String
});

// Recipe Model
const Receta = mongoose.model('Receta', recetaSchema);

// Routes
app.get('/', (req, res) => {
  res.send('API is running');
});

// Get all recipes
app.get('/recetat', async (req, res) => {
  try {
    const recetat = await Receta.find();
    res.json(recetat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW ENDPOINT: Search recipes by ingredients
app.get('/recetat/kerkimi', async (req, res) => {
  try {
    // Get ingredients from query string
    const ingredientsQuery = req.query.q;
    
    if (!ingredientsQuery) {
      return res.status(400).json({ message: 'Please provide ingredients to search for' });
    }
    
    // Split ingredients by comma
    const ingredients = ingredientsQuery.split(',').map(item => item.trim());
    
    // Search for recipes that contain any of the requested ingredients
    const recetat = await Receta.find({
      perberesit: { $in: ingredients }
    });
    
    res.json(recetat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipe by ID
app.get('/recetat/:id', async (req, res) => {
  try {
    const receta = await Receta.findOne({ id: req.params.id });
    if (!receta) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(receta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
