#!/usr/bin/env node

/**
 * Twitter Arc - Worker Module Test Script
 * Tests the worker's reputation computation with out-of-crypto circle data
 */

const { computeRep } = require('./worker/src/rep');
const { TweetScoutAPI } = require('./worker/src/tweetscout');
const { SparkToroAPI, AudienseAPI, HypeAuditorAPI } = require('./worker/src/out-of-crypto');

// Test accounts
const accounts = [
  'zeroxcholy',
  'gmwen7', 
  '0xmert_',
  '0xwenmoon'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'cyan');
  console.log('-'.repeat(40));
}

async function testWorkerReputation(handle) {
  logHeader(`Testing Worker Reputation for @${handle}`);
  
  try {
    // Initialize API clients
    const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY || 'YOUR_TS_KEY');
    const sparkToro = new SparkToroAPI(process.env.SPARKTORO_API_KEY || '');
    const audiense = new AudienseAPI(process.env.AUDIENSE_API_KEY || '');
    const hypeAuditor = new HypeAuditorAPI(process.env.HYPEAUDITOR_API_KEY || '');
    
    log('📡 Fetching data from all sources...', 'yellow');
    
    // Fetch data from all sources in parallel
    const [userData, smartFollowersData, sparkToroData, audienseData, hypeAuditorData] = await Promise.allSettled([
      tweetscout.getUser(handle),
      tweetscout.getSmartFollowers(handle, 1),
      sparkToro.getAudienceInterests(handle),
      audiense.getExpertLists(handle),
      hypeAuditor.getAudienceQuality(handle)
    ]);
    
    // Check results
    if (userData.status === 'rejected') {
      throw new Error(`Failed to fetch user data: ${userData.reason.message}`);
    }
    
    if (smartFollowersData.status === 'rejected') {
      throw new Error(`Failed to fetch smart followers: ${smartFollowersData.reason.message}`);
    }
    
    const user = userData.value;
    const smartFollowers = smartFollowersData.value;
    
    log('✅ Basic data fetched successfully', 'green');
    
    // Log out-of-crypto data results
    if (sparkToroData.status === 'fulfilled') {
      log(`✅ SparkToro data: ${sparkToroData.value.interests.length} interests`, 'green');
    } else {
      log(`❌ SparkToro failed: ${sparkToroData.reason.message}`, 'red');
    }
    
    if (audienseData.status === 'fulfilled') {
      log(`✅ Audiense data: ${audienseData.value.expertLists} expert lists`, 'green');
    } else {
      log(`❌ Audiense failed: ${audienseData.reason.message}`, 'red');
    }
    
    if (hypeAuditorData.status === 'fulfilled') {
      log(`✅ HypeAuditor data: ${hypeAuditorData.value.audienceQuality}% quality`, 'green');
    } else {
      log(`❌ HypeAuditor failed: ${hypeAuditorData.reason.message}`, 'red');
    }
    
    // Compute reputation with out-of-crypto data
    log('\n🧮 Computing reputation score...', 'yellow');
    
    const repData = computeRep(
      user,
      smartFollowers,
      sparkToroData.status === 'fulfilled' ? sparkToroData.value : undefined,
      audienseData.status === 'fulfilled' ? audienseData.value : undefined,
      hypeAuditorData.status === 'fulfilled' ? hypeAuditorData.value : undefined
    );
    
    // Display results
    logSection(`Worker Results for @${handle}`);
    
    console.log(`📊 Profile Information:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: @${user.username}`);
    console.log(`   Followers: ${user.followers_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Following: ${user.following_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Tweets: ${user.tweet_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Verified: ${user.verified ? '✅ Yes' : '❌ No'}`);
    
    console.log(`\n🎯 Reputation Analysis:`);
    console.log(`   REP Score: ${colors.bright}${repData.score}${colors.reset}`);
    console.log(`   Quality Score: ${repData.qualityScore}%`);
    console.log(`   Follower Count: ${repData.followerCount.toLocaleString()}`);
    console.log(`   Verified Followers: ${repData.verifiedFollowers}`);
    console.log(`   Total Smart Followers: ${repData.totalFollowers}`);
    
    if (repData.nonCryptoBonus) {
      console.log(`   Non-Crypto Bonus: +${repData.nonCryptoBonus} REP`);
    }
    
    if (repData.badges.length > 0) {
      console.log(`\n🏷️  Badges: ${repData.badges.map(badge => `[${badge}]`).join(' ')}`);
    }
    
    // Out-of-crypto circle data
    if (repData.audienceInterests?.length || repData.expertLists || repData.fakeRatio !== undefined) {
      console.log(`\n🌐 Out-of-Crypto Circle Data:`);
      
      if (repData.audienceInterests?.length) {
        console.log(`   Audience Interests: ${repData.audienceInterests.slice(0, 3).join(', ')}`);
      }
      
      if (repData.expertLists) {
        console.log(`   Expert Lists: ${repData.expertLists}`);
      }
      
      if (repData.fakeRatio !== undefined) {
        console.log(`   Audience Quality: ${100 - repData.fakeRatio}%`);
      }
    }
    
    console.log(`\n📝 Description:`);
    console.log(`   ${repData.description}`);
    
    return { success: true, repData, user, smartFollowers };
    
  } catch (error) {
    log(`❌ Worker test failed for @${handle}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runWorkerTests() {
  logHeader('Twitter Arc - Worker Module Test');
  log(`Testing ${accounts.length} accounts with full reputation computation...`, 'blue');
  
  // Check environment variables
  const envVars = {
    'TWEETSCOUT_KEY': process.env.TWEETSCOUT_KEY || 'YOUR_TS_KEY',
    'SPARKTORO_API_KEY': process.env.SPARKTORO_API_KEY,
    'AUDIENSE_API_KEY': process.env.AUDIENSE_API_KEY,
    'HYPEAUDITOR_API_KEY': process.env.HYPEAUDITOR_API_KEY
  };
  
  console.log('\n🔑 Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? `${value.substring(0, 8)}...` : 'Not set';
    console.log(`   ${key}: ${status} ${displayValue}`);
  });
  
  const results = [];
  
  for (const account of accounts) {
    const result = await testWorkerReputation(account);
    results.push({ account, ...result });
    
    // Add delay between requests
    if (account !== accounts[accounts.length - 1]) {
      log('Waiting 3 seconds before next request...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  logHeader('Worker Test Summary');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful > 0) {
    console.log('\n📈 Reputation Scores Summary:');
    results.filter(r => r.success).forEach(({ account, repData }) => {
      const outOfCryptoInfo = repData.nonCryptoBonus ? ` (+${repData.nonCryptoBonus} bonus)` : '';
      console.log(`   @${account}: ${repData.score} REP (${repData.qualityScore}% quality)${outOfCryptoInfo}`);
    });
  }
  
  // Compare with basic test
  console.log('\n🔄 Comparison with Basic Test:');
  console.log('   Run "npm run test:accounts" to compare with basic reputation computation');
  
  log('\n🎉 Worker test completed!', 'green');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Twitter Arc - Worker Module Test Script

Usage:
  node test-worker.js [options]

Options:
  --help, -h     Show this help message
  --account, -a  Test a specific account (e.g., -a zeroxcholy)

Environment Variables:
  TWEETSCOUT_KEY      Your TweetScout API key
  SPARKTORO_API_KEY   Your SparkToro API key (optional)
  AUDIENSE_API_KEY    Your Audiense API key (optional)
  HYPEAUDITOR_API_KEY Your HypeAuditor API key (optional)

Examples:
  node test-worker.js
  node test-worker.js -a zeroxcholy
  TWEETSCOUT_KEY=your_key node test-worker.js
`);
  process.exit(0);
}

// Check for specific account argument
const accountArg = process.argv.find(arg => arg.startsWith('--account=') || arg.startsWith('-a='));
if (accountArg) {
  const specificAccount = accountArg.split('=')[1];
  if (specificAccount) {
    log(`Testing specific account: @${specificAccount}`, 'blue');
    testWorkerReputation(specificAccount).then(() => {
      log('\n🎉 Single account worker test completed!', 'green');
      process.exit(0);
    }).catch(error => {
      log(`\n❌ Worker test failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }
} else {
  // Run full test suite
  runWorkerTests().catch(error => {
    log(`\n❌ Worker test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
} 