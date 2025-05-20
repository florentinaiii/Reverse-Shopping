const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3008;

app.use(cors());
app.use(express.json());

// Shërbe imazhet statike nga dosja assets/images
const assetsPath = path.join(__dirname, '..', 'assets');
app.use('/assets', express.static(assetsPath));

// Lexo recetat nga skedari JSON
const recipesPath = path.join(__dirname, 'data', 'recipes.json');
let recipes = [];

try {
  const data = fs.readFileSync(recipesPath, 'utf8');
  recipes = JSON.parse(data).recipes;
} catch (error) {
  console.error('Error reading recipes:', error);
}

// Kthe të gjitha recetat
app.get('/api/recipes', (req, res) => {
  res.json(recipes);
});

// Kërko receta bazuar në përbërësit
app.post('/api/search', (req, res) => {
  const { ingredients } = req.body;
  
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.json(recipes);
  }

  const matchingRecipes = recipes.filter(recipe => {
    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
    // Kontrollo nëse receta përmban të gjithë përbërësit e kërkuar
    return ingredients.every(ingredient => 
      recipeIngredients.some(recipeIng => recipeIng.includes(ingredient.toLowerCase()))
    );
  });

  res.json(matchingRecipes);
});

// Merr një recetë specifike me ID
app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404).json({ error: 'Recipe not found' });
  }
});

app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});
