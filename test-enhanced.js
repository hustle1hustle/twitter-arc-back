#!/usr/bin/env node

/**
 * Twitter Arc - Enhanced Test Script
 * Uses both TweetScout API and Twitter API v2 for comprehensive analysis
 */

const TWEETSCOUT_KEY = process.env.TWEETSCOUT_KEY || 'YOUR_TS_KEY';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'YOUR_BEARER_TOKEN';

const TSCOUT_BASE_URL = 'https://api.tweetscout.io/v2';
const TWITTER_BASE_URL = 'https://api.twitter.com/2';

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

// Rate limiting helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TweetScout API functions
async function fetchTweetScoutData(handle) {
  try {
    log(`📡 Fetching TweetScout data for @${handle}...`, 'yellow');
    
    // Fetch basic info
    log(`   🔍 Fetching basic info...`, 'yellow');
    const infoResponse = await fetch(`${TSCOUT_BASE_URL}/info/${handle}`, {
      headers: {
        'ApiKey': TWEETSCOUT_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!infoResponse.ok) {
      throw new Error(`TweetScout info failed: ${infoResponse.statusText}`);
    }

    const info = await infoResponse.json();
    log(`✅ TweetScout info fetched`, 'green');
    log(`   📊 Info data keys: ${Object.keys(info).join(', ')}`, 'blue');

    // Add delay between requests to avoid rate limiting
    await delay(1000);

    // Fetch score
    log(`   🔍 Fetching score...`, 'yellow');
    const scoreResponse = await fetch(`${TSCOUT_BASE_URL}/score/${handle}`, {
      headers: {
        'ApiKey': TWEETSCOUT_KEY,
        'Content-Type': 'application/json',
      },
    });

    let score = null;
    if (scoreResponse.ok) {
      score = await scoreResponse.json();
      log(`✅ TweetScout score fetched`, 'green');
      log(`   📊 Score data keys: ${Object.keys(score).join(', ')}`, 'blue');
    } else {
      log(`⚠️  TweetScout score failed: ${scoreResponse.statusText}`, 'yellow');
    }

    // Add delay before top followers request
    await delay(1000);

    // Fetch top followers with timeout
    log(`   🔍 Fetching top followers...`, 'yellow');
    const followersPromise = fetch(`${TSCOUT_BASE_URL}/top-followers/${handle}`, {
      headers: {
        'ApiKey': TWEETSCOUT_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Add 10 second timeout for top followers
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );

    let topFollowers = null;
    try {
      const followersResponse = await Promise.race([followersPromise, timeoutPromise]);
      
      if (followersResponse.ok) {
        topFollowers = await followersResponse.json();
        log(`✅ TweetScout top followers fetched`, 'green');
        log(`   📊 Followers data keys: ${Object.keys(topFollowers).join(', ')}`, 'blue');
      } else {
        log(`⚠️  TweetScout top followers failed: ${followersResponse.statusText}`, 'yellow');
      }
    } catch (error) {
      if (error.message === 'Timeout') {
        log(`⚠️  TweetScout top followers timed out after 10 seconds`, 'yellow');
      } else {
        log(`⚠️  TweetScout top followers error: ${error.message}`, 'yellow');
      }
    }

    log(`🎯 TweetScout data collection completed for @${handle}`, 'green');
    return { info, score, topFollowers };
  } catch (error) {
    log(`❌ TweetScout API error: ${error.message}`, 'red');
    return null;
  }
}

// Twitter API v2 functions
async function fetchTwitterData(handle) {
  try {
    log(`🐦 Fetching Twitter API v2 data for @${handle}...`, 'yellow');
    
    // Fetch user by username with expanded fields
    log(`   🔍 Fetching user data...`, 'yellow');
    const userResponse = await fetch(
      `${TWITTER_BASE_URL}/users/by/username/${handle}?user.fields=id,username,name,description,profile_image_url,verified,public_metrics,created_at,protected,withheld,entities,location,url,verified_type`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      if (userResponse.status === 429) {
        log(`⚠️  Twitter API rate limit exceeded, skipping Twitter data`, 'yellow');
        return null;
      }
      throw new Error(`Twitter API failed: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    log(`✅ Twitter API data fetched`, 'green');
    log(`   📊 Twitter data keys: ${Object.keys(userData).join(', ')}`, 'blue');
    
    if (userData.data) {
      log(`   👤 User: @${userData.data.username} (${userData.data.name})`, 'blue');
    }

    return userData;
  } catch (error) {
    if (error.message.includes('Too Many Requests')) {
      log(`⚠️  Twitter API rate limit exceeded, skipping Twitter data`, 'yellow');
      return null;
    }
    log(`❌ Twitter API error: ${error.message}`, 'red');
    return null;
  }
}

// Enhanced reputation computation
function computeEnhancedRep(tweetScoutData, twitterData) {
  log(`🧮 Computing enhanced reputation...`, 'yellow');
  
  if (!tweetScoutData?.info && !twitterData?.data) {
    log(`❌ No data available for reputation computation`, 'red');
    return null;
  }

  const tsInfo = tweetScoutData?.info;
  const twitterUser = twitterData?.data;
  const tsScore = tweetScoutData?.score;

  log(`   📊 Using data from: ${tsInfo ? 'TweetScout' : ''}${tsInfo && twitterUser ? ' + ' : ''}${twitterUser ? 'Twitter API' : ''}`, 'blue');

  // Base metrics - use TweetScout data first, fallback to Twitter API
  const followerCount = tsInfo?.followers_count || twitterUser?.public_metrics?.followers_count || 0;
  const followingCount = tsInfo?.friends_count || twitterUser?.public_metrics?.following_count || 0;
  const tweetCount = tsInfo?.tweets_count || twitterUser?.public_metrics?.tweet_count || 0;
  const isVerified = tsInfo?.verified || twitterUser?.verified || false;
  const createdAt = tsInfo?.register_date || twitterUser?.created_at;

  log(`   📈 Base metrics: ${followerCount} followers, ${tweetCount} tweets, verified: ${isVerified}`, 'blue');

  // Calculate account age
  let accountAgeDays = 0;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const now = new Date();
    accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    log(`   📅 Account age: ${accountAgeDays} days`, 'blue');
  }

  // TweetScout score - DIRECT IMPACT (1 point = 1 REP)
  const tweetScoutScore = tsScore?.score || 0;
  log(`   🎯 TweetScout score: ${tweetScoutScore}`, 'blue');

  // Base reputation calculation
  let baseScore = Math.log10(followerCount + 1) * 100;
  
  // Account age bonus (older accounts get bonus)
  const ageBonus = Math.min(accountAgeDays / 365, 50); // Max 50 points for 1+ year old accounts
  
  // Verification bonus
  const verificationBonus = isVerified ? 50 : 0;
  
  // TweetScout score bonus - DIRECT CONVERSION
  const tweetScoutBonus = Math.round(tweetScoutScore); // 1 TweetScout point = 1 REP
  
  // Engagement rate (simplified)
  const engagementRate = followerCount > 0 ? (tweetCount / followerCount) * 1000 : 0;
  const engagementBonus = Math.min(engagementRate, 50);

  // Calculate final score
  const finalScore = Math.round(baseScore + ageBonus + verificationBonus + tweetScoutBonus + engagementBonus);

  log(`   💰 Score breakdown: base=${Math.round(baseScore)}, age=${Math.round(ageBonus)}, verified=${verificationBonus}, ts=${tweetScoutBonus}, engagement=${Math.round(engagementBonus)}`, 'blue');

  // Determine badges
  const badges = [];
  if (isVerified) badges.push('Verified');
  if (accountAgeDays > 365) badges.push('Veteran');
  if (followerCount > 10000) badges.push('Influencer');
  if (tweetScoutScore > 50) badges.push('TweetScout Elite');
  if (engagementRate > 10) badges.push('High Engagement');
  if (accountAgeDays > 730) badges.push('Long-term User');

  // Account type detection
  let accountType = 'Regular';
  if (isVerified && followerCount > 50000) accountType = 'Celebrity';
  else if (isVerified && followerCount > 10000) accountType = 'Influencer';
  else if (accountAgeDays > 365 && followerCount > 5000) accountType = 'Established';
  else if (accountAgeDays < 30) accountType = 'New';

  log(`   🏷️  Account type: ${accountType}, Badges: ${badges.join(', ')}`, 'blue');

  const result = {
    score: finalScore,
    followerCount,
    followingCount,
    tweetCount,
    isVerified,
    accountAgeDays,
    tweetScoutScore,
    engagementRate: engagementRate.toFixed(2),
    badges,
    accountType,
    ageBonus: Math.round(ageBonus),
    verificationBonus,
    tweetScoutBonus: Math.round(tweetScoutBonus),
    engagementBonus: Math.round(engagementBonus),
    baseScore: Math.round(baseScore)
  };

  log(`✅ Reputation computation completed: ${finalScore} REP`, 'green');
  return result;
}

function displayEnhancedResults(handle, tweetScoutData, twitterData, repData) {
  log(`📋 Displaying results for @${handle}...`, 'yellow');
  
  logSection(`Enhanced Results for @${handle}`);
  
  const tsInfo = tweetScoutData?.info;
  const twitterUser = twitterData?.data;
  
  console.log(`📊 Profile Information:`);
  if (tsInfo) {
    console.log(`   Name: ${tsInfo.name || 'N/A'}`);
    console.log(`   Username: @${tsInfo.screen_name || handle}`);
    console.log(`   Followers: ${tsInfo.followers_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Following: ${tsInfo.friends_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Tweets: ${tsInfo.tweets_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Verified: ${tsInfo.verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${tsInfo.register_date || 'N/A'}`);
  } else if (twitterUser) {
    console.log(`   Name: ${twitterUser.name || 'N/A'}`);
    console.log(`   Username: @${twitterUser.username || handle}`);
    console.log(`   Followers: ${twitterUser.public_metrics?.followers_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Following: ${twitterUser.public_metrics?.following_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Tweets: ${twitterUser.public_metrics?.tweet_count?.toLocaleString() || 'N/A'}`);
    console.log(`   Verified: ${twitterUser.verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${twitterUser.created_at || 'N/A'}`);
  }
  
  if (repData) {
    console.log(`\n🎯 Enhanced Reputation Analysis:`);
    console.log(`   REP Score: ${colors.bright}${repData.score}${colors.reset}`);
    console.log(`   Account Type: ${repData.accountType}`);
    console.log(`   Account Age: ${repData.accountAgeDays} days`);
    console.log(`   TweetScout Score: ${repData.tweetScoutScore}`);
    console.log(`   Engagement Rate: ${repData.engagementRate}%`);
    
    console.log(`\n💰 Score Breakdown:`);
    console.log(`   Age Bonus: +${repData.ageBonus}`);
    console.log(`   Verification Bonus: +${repData.verificationBonus}`);
    console.log(`   TweetScout Bonus: +${repData.tweetScoutBonus}`);
    console.log(`   Engagement Bonus: +${repData.engagementBonus}`);
    
    if (repData.badges.length > 0) {
      console.log(`\n🏷️  Badges: ${repData.badges.map(badge => `[${badge}]`).join(' ')}`);
    }
  }

  // TweetScout specific data
  if (tweetScoutData?.score) {
    console.log(`\n📈 TweetScout Analysis:`);
    console.log(`   Score: ${tweetScoutData.score.score || 'N/A'}`);
    console.log(`   Rank: ${tweetScoutData.score.rank || 'N/A'}`);
    console.log(`   Percentile: ${tweetScoutData.score.percentile || 'N/A'}`);
  }

  // Top followers
  if (tweetScoutData?.topFollowers?.data?.length > 0) {
    console.log(`\n👥 Top Followers:`);
    tweetScoutData.topFollowers.data.slice(0, 3).forEach((follower, index) => {
      console.log(`   ${index + 1}. @${follower.screen_name} (${follower.followers_count?.toLocaleString() || 'N/A'} followers)`);
    });
  }

  log(`✅ Results display completed for @${handle}`, 'green');
}

async function testEnhancedAccount(handle) {
  logHeader(`Testing Enhanced Account: @${handle}`);
  
  log(`🚀 Starting enhanced test for @${handle}...`, 'blue');
  
  // Fetch data from both APIs in parallel
  log(`📡 Initiating parallel API requests...`, 'yellow');
  const [tweetScoutData, twitterData] = await Promise.allSettled([
    fetchTweetScoutData(handle),
    fetchTwitterData(handle)
  ]);

  log(`📊 API requests completed, processing results...`, 'yellow');

  const tsData = tweetScoutData.status === 'fulfilled' ? tweetScoutData.value : null;
  const twData = twitterData.status === 'fulfilled' ? twitterData.value : null;

  if (!tsData && !twData) {
    log(`❌ No data available for @${handle}`, 'red');
    return { success: false };
  }

  log(`✅ Data received, computing reputation...`, 'green');

  // Compute enhanced reputation
  const repData = computeEnhancedRep(tsData, twData);
  
  if (repData) {
    log(`✅ Reputation computed, displaying results...`, 'green');
    displayEnhancedResults(handle, tsData, twData, repData);
  } else {
    log(`❌ Failed to compute reputation`, 'red');
  }

  log(`🎯 Enhanced test completed for @${handle}`, 'green');
  return { success: true, repData, tweetScoutData: tsData, twitterData: twData };
}

async function runEnhancedTests() {
  logHeader('Twitter Arc - Enhanced Reputation Test');
  log(`Testing ${accounts.length} accounts with TweetScout + Twitter API v2...`, 'blue');
  
  console.log(`🔑 TweetScout API Key: ${TWEETSCOUT_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🐦 Twitter Bearer Token: ${TWITTER_BEARER_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  
  const results = [];
  
  for (const account of accounts) {
    const result = await testEnhancedAccount(account);
    results.push({ account, ...result });
    
    // Add delay between requests
    if (account !== accounts[accounts.length - 1]) {
      log('Waiting 5 seconds before next request...', 'yellow');
      await delay(5000);
    }
  }
  
  // Summary
  logHeader('Enhanced Test Summary');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful > 0) {
    console.log('\n📈 Enhanced Reputation Scores Summary:');
    results.filter(r => r.success && r.repData).forEach(({ account, repData }) => {
      console.log(`   @${account}: ${repData.score} REP (${repData.accountType})`);
    });
  }
  
  log('\n🎉 Enhanced test completed!', 'green');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Twitter Arc - Enhanced Test Script

Usage:
  node test-enhanced.js [options]

Options:
  --help, -h     Show this help message
  --account, -a  Test a specific account (e.g., -a zeroxcholy)

Environment Variables:
  TWEETSCOUT_KEY       Your TweetScout API key
  TWITTER_BEARER_TOKEN Your Twitter API v2 bearer token

Examples:
  node test-enhanced.js
  node test-enhanced.js -a zeroxcholy
`);
  process.exit(0);
}

// Check for specific account argument
const accountArg = process.argv.find(arg => arg.startsWith('--account=') || arg.startsWith('-a='));
if (accountArg) {
  const specificAccount = accountArg.split('=')[1];
  if (specificAccount) {
    log(`Testing specific account: @${specificAccount}`, 'blue');
    testEnhancedAccount(specificAccount).then(() => {
      log('\n🎉 Single account enhanced test completed!', 'green');
      process.exit(0);
    }).catch(error => {
      log(`\n❌ Enhanced test failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }
} else {
  // Run full test suite
  runEnhancedTests().catch(error => {
    log(`\n❌ Enhanced test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
} 