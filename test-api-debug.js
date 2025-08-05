#!/usr/bin/env node

/**
 * Twitter Arc - API Debug Script
 * Tests TweetScout API directly to debug issues
 */

const TWEETSCOUT_KEY = process.env.TWEETSCOUT_KEY || 'YOUR_TS_KEY';
const TSCOUT_BASE_URL = 'https://api.tweetscout.io/v2';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

async function testAPIEndpoint(endpoint, description, authHeader = 'Bearer') {
  try {
    log(`Testing ${description}...`, 'yellow');
    log(`Using auth header: ${authHeader}`, 'cyan');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Try different authorization header formats
    if (authHeader === 'Bearer') {
      headers['Authorization'] = `Bearer ${TWEETSCOUT_KEY}`;
    } else if (authHeader === 'X-API-Key') {
      headers['X-API-Key'] = TWEETSCOUT_KEY;
    } else if (authHeader === 'api-key') {
      headers['api-key'] = TWEETSCOUT_KEY;
    }
    
    log(`Headers: ${JSON.stringify(headers, null, 2)}`, 'cyan');
    
    const response = await fetch(`${TSCOUT_BASE_URL}${endpoint}`, {
      headers,
    });

    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red');
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Success: ${JSON.stringify(data, null, 2)}`, 'green');
      return { success: true, data };
    } else {
      const errorText = await response.text();
      log(`❌ Error: ${errorText}`, 'red');
      return { success: false, error: errorText };
    }
  } catch (error) {
    log(`❌ Network Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runAPIDebug() {
  logHeader('Twitter Arc - API Debug Test');
  
  console.log(`🔑 API Key: ${TWEETSCOUT_KEY.substring(0, 8)}...`);
  console.log(`🌐 Base URL: ${TSCOUT_BASE_URL}`);
  
  // Test different authorization header formats
  const authFormats = ['Bearer', 'X-API-Key', 'api-key'];
  
  for (const authFormat of authFormats) {
    log(`\n🔍 Testing with ${authFormat} header format...`, 'blue');
    
    const result = await testAPIEndpoint('/user/elonmusk', `Public user with ${authFormat}`, authFormat);
    
    if (result.success) {
      log(`✅ ${authFormat} format works!`, 'green');
      break;
    } else {
      log(`❌ ${authFormat} format failed`, 'red');
    }
    
    // Add delay between tests
    if (authFormat !== authFormats[authFormats.length - 1]) {
      log('Waiting 1 second...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  logHeader('API Debug Summary');
  log('This test helps identify the correct authorization format', 'cyan');
}

runAPIDebug().catch(error => {
  log(`❌ Debug test failed: ${error.message}`, 'red');
  process.exit(1);
}); 