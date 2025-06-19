// server/routes/recipeRoute.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// Get all recipes
router.get('/', async (req, res) => {
  try {
    console.log('GET / - Fetching all recipes');
    const recipes = await Recipe.find();
    console.log(`Found ${recipes.length} recipes in the database`);
    console.log('Recipe sample:', recipes.length > 0 ? recipes[0] : 'No recipes found');
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Search recipes by ingredients only - must match ALL ingredients
router.get('/search', async (req, res) => {
  const query = req.query.q?.split(',') || [];

  try {
    if (query.length === 0) {
      const recipes = await Recipe.find();
      return res.json(recipes);
    }
    
    // Create search terms from the query
    const searchTerms = query.map(q => q.trim().toLowerCase());
    
    // Search for recipes where ALL ingredients in searchTerms are in the recipe's ingredients list
    // We use regex with 'i' flag to make the search case-insensitive
    const recipes = await Recipe.find({
      // Match recipes that contain ALL of the search terms in their ingredients
      perberesit: { 
        $all: searchTerms.map(term => new RegExp(term, 'i')) 
      }
    });
    
    console.log(`Found ${recipes.length} recipes matching ALL search terms: ${searchTerms.join(', ')}`);
    res.json(recipes);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

module.exports = router;
