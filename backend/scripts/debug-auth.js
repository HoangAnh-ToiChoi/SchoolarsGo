/**
 * debug-auth.js — Debug Auth API response
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debug() {
  console.log('\n=== DEBUG AUTH API ===\n');

  // Register
  console.log('1. Registering user...');
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: `debug_${Date.now()}@test.com`,
      password: 'Test1234!',
      full_name: 'Debug User',
    });
    console.log('Response status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2));
    console.log('User ID:', res.data?.data?.user?.id || res.data?.user?.id);
    console.log('Token:', res.data?.data?.token || res.data?.token ? 'EXISTS' : 'MISSING');
  } catch (err) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
}

debug().catch(console.error);
