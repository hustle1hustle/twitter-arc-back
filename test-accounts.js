#!/usr/bin/env node

/**
 * Twitter Arc - Account Reputation Test Script
 * Tests reputation computation for specific Twitter accounts
 */

const accounts = [
  'zeroxcholy',
  'gmwen7', 
  '0xmert_',
  '0xwenmoon'
];

// Configuration
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

async function fetchTweetScoutData(handle) {
  try {
    log(`Fetching data for @${handle}...`, 'yellow');
    
    // Fetch user profile
    const profileResponse = await fetch(`${TSCOUT_BASE_URL}/user/${handle}`, {
      headers: {
        'Authorization': `Bearer ${TWEETSCOUT_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();
    log(`✓ Profile fetched: ${profile.name} (@${profile.username})`, 'green');

    // Fetch smart followers
    const followersResponse = await fetch(`${TSCOUT_BASE_URL}/user/${handle}/smartFollowers?page=1`, {
      headers: {
        'Authorization': `Bearer ${TWEETSCOUT_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!followersResponse.ok) {
      throw new Error(`Smart followers fetch failed: ${followersResponse.statusText}`);
    }

    const smartFollowers = await followersResponse.json();
    log(`✓ Smart followers fetched: ${smartFollowers.data?.length || 0} followers`, 'green');

    return { profile, smartFollowers };
  } catch (error) {
    log(`✗ Error fetching data for @${handle}: ${error.message}`, 'red');
    return null;
  }
}

// Simplified reputation computation (basic version)
function computeBasicRep(profile, smartFollowers) {
  const followerCount = profile.followers_count || 0;
  const verifiedFollowers = smartFollowers.data?.filter(f => f.verified).length || 0;
  const totalFollowers = smartFollowers.data?.length || 0;

  // Base score from follower count (logarithmic scale)
  let baseScore = Math.log10(followerCount + 1) * 100;

  // Quality multiplier based on verified followers ratio
  const verifiedRatio = totalFollowers > 0 ? verifiedFollowers / totalFollowers : 0;
  const qualityMultiplier = 0.5 + (verifiedRatio * 0.5);

  // Blue check bonus
  const blueCheckBonus = profile.verified ? 50 : 0;

  // Engagement bonus (simplified)
  const engagementBonus = Math.min(followerCount / 1000, 100);

  // Calculate final score
  const finalScore = Math.round((baseScore * qualityMultiplier) + blueCheckBonus + engagementBonus);

  // Quality score percentage
  const qualityScore = Math.round(verifiedRatio * 100);

  // Determine badges
  const badges = [];
  if (profile.verified) badges.push('Verified');
  if (verifiedRatio > 0.3) badges.push('High Quality');
  if (followerCount > 10000) badges.push('Influencer');
  if (verifiedRatio > 0.5) badges.push('Elite');

  return {
    score: finalScore,
    qualityScore,
    followerCount,
    verifiedFollowers,
    totalFollowers,
    badges,
    verifiedRatio: verifiedRatio.toFixed(3)
  };
}

function displayResults(handle, data, repData) {
  logSection(`Results for @${handle}`);
  
  if (!data) {
    log('❌ No data available', 'red');
    return;
  }

  const { profile, smartFollowers } = data;
  
  console.log(`📊 Profile Information:`);
  console.log(`   Name: ${profile.name}`);
  console.log(`   Username: @${profile.username}`);
  console.log(`   Followers: ${profile.followers_count?.toLocaleString() || 'N/A'}`);
  console.log(`   Following: ${profile.following_count?.toLocaleString() || 'N/A'}`);
  console.log(`   Tweets: ${profile.tweet_count?.toLocaleString() || 'N/A'}`);
  console.log(`   Verified: ${profile.verified ? '✅ Yes' : '❌ No'}`);
  
  console.log(`\n🎯 Reputation Analysis:`);
  console.log(`   REP Score: ${colors.bright}${repData.score}${colors.reset}`);
  console.log(`   Quality Score: ${repData.qualityScore}%`);
  console.log(`   Verified Ratio: ${(repData.verifiedRatio * 100).toFixed(1)}%`);
  console.log(`   Smart Followers: ${repData.totalFollowers}`);
  console.log(`   Verified Followers: ${repData.verifiedFollowers}`);
  
  if (repData.badges.length > 0) {
    console.log(`\n🏷️  Badges: ${repData.badges.map(badge => `[${badge}]`).join(' ')}`);
  }
  
  // Sample of smart followers
  if (smartFollowers.data && smartFollowers.data.length > 0) {
    console.log(`\n👥 Sample Smart Followers:`);
    smartFollowers.data.slice(0, 5).forEach((follower, index) => {
      const verifiedIcon = follower.verified ? '✅' : '❌';
      console.log(`   ${index + 1}. @${follower.username} ${verifiedIcon} (${follower.followers_count?.toLocaleString() || 'N/A'} followers)`);
    });
  }
}

async function testAccount(handle) {
  logHeader(`Testing Account: @${handle}`);
  
  const data = await fetchTweetScoutData(handle);
  
  if (data) {
    const repData = computeBasicRep(data.profile, data.smartFollowers);
    displayResults(handle, data, repData);
  }
  
  return data;
}

async function runTests() {
  logHeader('Twitter Arc - Account Reputation Test');
  log(`Testing ${accounts.length} accounts...`, 'blue');
  log(`TweetScout API Key: ${TWEETSCOUT_KEY ? '✅ Configured' : '❌ Missing'}`, TWEETSCOUT_KEY ? 'green' : 'red');
  
  const results = [];
  
  for (const account of accounts) {
    const result = await testAccount(account);
    results.push({ account, success: !!result, data: result });
    
    // Add delay between requests to be respectful to the API
    if (account !== accounts[accounts.length - 1]) {
      log('Waiting 2 seconds before next request...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  logHeader('Test Summary');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful > 0) {
    console.log('\n📈 Reputation Scores Summary:');
    results.filter(r => r.success).forEach(({ account, data }) => {
      const repData = computeBasicRep(data.profile, data.smartFollowers);
      console.log(`   @${account}: ${repData.score} REP (${repData.qualityScore}% quality)`);
    });
  }
  
  log('\n🎉 Test completed!', 'green');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Twitter Arc - Account Reputation Test Script

Usage:
  node test-accounts.js [options]

Options:
  --help, -h     Show this help message
  --account, -a  Test a specific account (e.g., -a zeroxcholy)

Environment Variables:
  TWEETSCOUT_KEY  Your TweetScout API key

Examples:
  node test-accounts.js
  node test-accounts.js -a zeroxcholy
  TWEETSCOUT_KEY=your_key node test-accounts.js
`);
  process.exit(0);
}

// Check for specific account argument
const accountArg = process.argv.find(arg => arg.startsWith('--account=') || arg.startsWith('-a='));
if (accountArg) {
  const specificAccount = accountArg.split('=')[1];
  if (specificAccount) {
    log(`Testing specific account: @${specificAccount}`, 'blue');
    testAccount(specificAccount).then(() => {
      log('\n🎉 Single account test completed!', 'green');
      process.exit(0);
    }).catch(error => {
      log(`\n❌ Test failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }
} else {
  // Run full test suite
  runTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
} 