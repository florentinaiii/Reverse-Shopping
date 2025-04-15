// types.ts
export interface Recipe {
    id: string;
    name: string;
    ingredients: string[];
    image: any;
    instructions: string;
  }
  
  export type RootStackParamList = {
    Home: undefined;
    MyRecipes: undefined;
    RecipeDetail: { recipe: Recipe };
  };