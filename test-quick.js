#!/usr/bin/env node

/**
 * Twitter Arc - Quick Test Script
 * Fast testing without delays and better error handling
 */

const TWEETSCOUT_KEY = process.env.TWEETSCOUT_KEY || 'YOUR_TS_KEY';

const TSCOUT_BASE_URL = 'https://api.tweetscout.io/v2';

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
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Quick TweetScout data fetch with timeout
async function fetchTweetScoutData(handle) {
  try {
    // Fetch basic info with 5 second timeout
    const infoPromise = fetch(`${TSCOUT_BASE_URL}/info/${handle}`, {
      headers: { 'ApiKey': TWEETSCOUT_KEY },
      signal: AbortSignal.timeout(5000)
    });

    const infoResponse = await infoPromise;
    if (!infoResponse.ok) {
      throw new Error(`TweetScout info failed: ${infoResponse.statusText}`);
    }

    const info = await infoResponse.json();

    // Fetch score with 5 second timeout
    const scorePromise = fetch(`${TSCOUT_BASE_URL}/score/${handle}`, {
      headers: { 'ApiKey': TWEETSCOUT_KEY },
      signal: AbortSignal.timeout(5000)
    });

    let score = null;
    try {
      const scoreResponse = await scorePromise;
      if (scoreResponse.ok) {
        score = await scoreResponse.json();
      }
    } catch (error) {
      // Ignore score fetch errors
    }

    return { info, score };
  } catch (error) {
    throw new Error(`TweetScout API error: ${error.message}`);
  }
}

// Quick reputation computation
function computeQuickRep(tweetScoutData) {
  if (!tweetScoutData?.info) {
    return null;
  }

  const info = tweetScoutData.info;
  const score = tweetScoutData.score;

  // Base metrics
  const followerCount = info.followers_count || 0;
  const tweetCount = info.tweets_count || 0;
  const isVerified = info.verified || false;
  const createdAt = info.register_date;

  // Calculate account age
  let accountAgeDays = 0;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const now = new Date();
    accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  }

  // TweetScout score - DIRECT IMPACT (1 point = 1 REP)
  const tweetScoutScore = score?.score || 0;
  const tweetScoutBonus = Math.round(tweetScoutScore);

  // Base reputation calculation
  const baseScore = Math.log10(followerCount + 1) * 100;
  const ageBonus = Math.min(accountAgeDays / 365, 50);
  const verificationBonus = isVerified ? 50 : 0;
  const engagementRate = followerCount > 0 ? (tweetCount / followerCount) * 1000 : 0;
  const engagementBonus = Math.min(engagementRate, 50);

  // Calculate final score
  const finalScore = Math.round(baseScore + ageBonus + verificationBonus + tweetScoutBonus + engagementBonus);

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

  return {
    score: finalScore,
    followerCount,
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
}

// Quick test function
async function testQuickAccount(handle) {
  try {
    const tweetScoutData = await fetchTweetScoutData(handle);
    const repData = computeQuickRep(tweetScoutData);
    
    if (repData) {
      console.log(`\n📊 @${handle}:`);
      console.log(`   REP Score: ${colors.bright}${repData.score}${colors.reset}`);
      console.log(`   TweetScout: ${repData.tweetScoutScore} → +${repData.tweetScoutBonus} REP`);
      console.log(`   Followers: ${repData.followerCount.toLocaleString()}`);
      console.log(`   Type: ${repData.accountType}`);
      console.log(`   Badges: ${repData.badges.join(', ')}`);
    }
    
    return { success: true, repData };
  } catch (error) {
    console.log(`\n❌ @${handle}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runQuickTests() {
  console.log('\n============================================================');
  log('Twitter Arc - Quick REP Test', 'bright');
  console.log('============================================================');
  console.log(`🔑 TweetScout API Key: ${TWEETSCOUT_KEY ? '✅ Configured' : '❌ Missing'}`);
  
  const results = [];
  
  for (const account of accounts) {
    const result = await testQuickAccount(account);
    results.push({ account, ...result });
  }
  
  // Summary
  console.log('\n============================================================');
  log('Quick Test Summary', 'bright');
  console.log('============================================================');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (successful > 0) {
    console.log('\n🏆 REP Rankings:');
    results
      .filter(r => r.success && r.repData)
      .sort((a, b) => b.repData.score - a.repData.score)
      .forEach(({ account, repData }, index) => {
        console.log(`   ${index + 1}. @${account}: ${repData.score} REP (${repData.accountType})`);
      });
  }
  
  log('\n🎉 Quick test completed!', 'green');
}

// Run tests
runQuickTests().catch(error => {
  log(`\n❌ Quick test failed: ${error.message}`, 'red');
  process.exit(1);
}); 