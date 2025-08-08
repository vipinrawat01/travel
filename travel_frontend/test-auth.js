// Simple test script to verify backend authentication endpoints
// Run this with: node test-auth.js

const API_BASE_URL = 'http://localhost:8000/api';

async function testAuthEndpoints() {
  console.log('Testing authentication endpoints...\n');

  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  try {
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'testpass123',
        confirm_password: 'testpass123'
      }),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData.message);
      console.log('Token received:', registerData.token ? 'Yes' : 'No');
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ Registration failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
  }

  console.log('\n2. Testing user login...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.message);
      console.log('Token received:', loginData.token ? 'Yes' : 'No');
      
      // Test 3: Get user profile with token
      console.log('\n3. Testing user profile retrieval...');
      const profileResponse = await fetch(`${API_BASE_URL}/user/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${loginData.token}`
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Profile retrieval successful');
        console.log('User:', profileData.username);
        console.log('Email:', profileData.email);
      } else {
        const errorData = await profileResponse.json();
        console.log('❌ Profile retrieval failed:', errorData);
      }
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }

  console.log('\n✅ Authentication test completed!');
}

// Check if backend is running
async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'GET',
    });
    console.log('Backend is accessible');
    return true;
  } catch (error) {
    console.log('❌ Backend is not accessible. Make sure the Django server is running on http://localhost:8000');
    return false;
  }
}

async function runTests() {
  const backendAvailable = await checkBackendStatus();
  if (backendAvailable) {
    await testAuthEndpoints();
  }
}

runTests();
