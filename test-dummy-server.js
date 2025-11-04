#!/usr/bin/env node

/**
 * Test script for dummy image upload server (Frappe-compatible)
 * Run with: node test-dummy-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3001';

async function testServer() {
  console.log('🧪 Testing Dummy Frappe-Compatible Image Upload Server...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  console.log('');

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await makeRequest('GET', '/health');
    console.log('✅ Health check passed:', healthResponse.status);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Test endpoint
  console.log('2️⃣ Testing API test endpoint...');
  try {
    const testResponse = await makeRequest('GET', '/api/test');
    console.log('✅ Test endpoint passed:', testResponse.data?.message);
    console.log('📋 Expected format:', testResponse.data?.expectedFormat);
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
    return;
  }

  // Test 3: List available files
  console.log('3️⃣ Testing file listing endpoint...');
  try {
    const filesResponse = await makeRequest('GET', '/api/files');
    console.log('✅ File listing works');
    console.log(`📷 Available files: ${filesResponse.data?.files?.length || 0} files`);
  } catch (error) {
    console.error('❌ File listing failed:', error.message);
  }

  // Test 4: Static file serving
  console.log('4️⃣ Testing static file serving...');
  try {
    const imageResponse = await makeRequest('GET', '/assets/icon.png');
    console.log('✅ Static file serving works');
    console.log(`📷 Image size: ${imageResponse.headers['content-length']} bytes`);
  } catch (error) {
    console.error('❌ Static file serving failed:', error.message);
  }

  console.log('');
  console.log('🎉 Basic tests completed!');
  console.log('🚀 Server is ready for testing image upload functionality');
  console.log('');
  console.log('📋 Next: Test actual image upload with cURL or Postman:');
  console.log('   curl -X POST "http://localhost:3001/api/method/upload_file" \\');
  console.log('     -H "Authorization: token 0a3ac2415acc9a4:ee04f1881306858" \\');
  console.log('     -F "is_private=0" \\');
  console.log('     -F "folder=Home/Consumer Survey" \\');
  console.log('     -F "file=@assets/icon.png"');
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dummy-Server-Test/1.0'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Check if server is running first
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.request(`${SERVER_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking if server is running...');

  const isRunning = await checkServerRunning();

  if (!isRunning) {
    console.log('❌ Server is not running!');
    console.log('💡 Start the server first:');
    console.log('   node dummy-server.js');
    console.log('   OR');
    console.log('   npm run start');
    return;
  }

  await testServer();
}

main().catch(console.error);
