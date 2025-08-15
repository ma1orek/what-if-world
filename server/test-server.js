// Simple test script to verify server functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testServer() {
  console.log('🧪 Testing History Rewriter Live Server...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: API documentation
    console.log('\n2. Testing API documentation...');
    const apiResponse = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API docs available:', apiResponse.data.name);
    
    // Test 3: History rewrite endpoint
    console.log('\n3. Testing history rewrite endpoint...');
    const historyResponse = await axios.post(`${BASE_URL}/api/rewrite-history`, {
      prompt: 'What if Napoleon had won at Waterloo?'
    });
    console.log('✅ History rewrite working:', historyResponse.data.summary.substring(0, 50) + '...');
    
    // Test 4: Narration endpoint
    console.log('\n4. Testing narration endpoint...');
    const narrationResponse = await axios.post(`${BASE_URL}/api/narrate`, {
      text: 'This is a test narration to verify the TTS endpoint functionality.'
    });
    console.log('✅ Narration working:', `${narrationResponse.data.subtitles.length} subtitles generated`);
    
    // Test 5: Error handling
    console.log('\n5. Testing error handling...');
    try {
      await axios.post(`${BASE_URL}/api/rewrite-history`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Error handling working:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 All server tests passed!');
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testServer();
}

module.exports = testServer;