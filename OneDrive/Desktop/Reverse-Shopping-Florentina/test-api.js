// test-api.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data);

    // Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health endpoint:', healthResponse.data);

    // Test recipes endpoint
    console.log('\n3. Testing recipes endpoint...');
    const recipesResponse = await axios.get(`${API_BASE_URL}/recipes`);
    console.log('✅ Recipes endpoint:', recipesResponse.data);

    console.log('\n🎉 All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAPI(); 