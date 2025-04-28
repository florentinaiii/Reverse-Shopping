import axios from 'axios';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

export const searchByIngredients = async (ingredients: string[]) => {
  try {
    // Kjo API nuk lejon kërkim direkt me shumë përbërës, 
    // kështu që do të bëjmë kërkesa të veçanta dhe do të filtrojmë rezultatet
    const allMeals: any[] = [];
    
    // Bëj kërkesa të veçanta për secilin përbërës
    for (const ingredient of ingredients) {
      const response = await axios.get(`${BASE_URL}filter.php?i=${ingredient.trim()}`);
      if (response.data.meals) {
        allMeals.push(...response.data.meals);
      }
    }
    
    // Filtro recetat që përmbajnë të gjithë përbërësit
    const filteredMeals = allMeals.filter(meal => {
      // Për secilën recetë, kontrollo nëse përmban të gjithë përbërësit
      return ingredients.every(ing => 
        meal.strMeal.toLowerCase().includes(ing.toLowerCase()) || 
        meal.strIngredient1?.toLowerCase().includes(ing.toLowerCase()) ||
        // Në praktikë, duhet të kontrollosh të gjithë ingredientët (1-20)
        // Kjo është një zgjidhje e thjeshtësuar
        false
      );
    });
    
    // Elimino duplikatet
    const uniqueMeals = filteredMeals.filter((meal, index, self) =>
      index === self.findIndex(m => m.idMeal === meal.idMeal)
    );
    
    return uniqueMeals;
  } catch (error) {
    console.error('Error searching recipes:', error);
    return [];
  }
};

export const getMealDetails = async (mealId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}lookup.php?i=${mealId}`);
    return response.data.meals?.[0] || null;
  } catch (error) {
    console.error('Error fetching meal details:', error);
    return null;
  }
};