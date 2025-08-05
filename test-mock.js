#!/usr/bin/env node

/**
 * Twitter Arc - Mock Test Script
 * Demonstrates reputation computation with mock data
 */

// Mock data for testing
const mockAccounts = [
  {
    handle: 'zeroxcholy',
    profile: {
      id: '123456789',
      username: 'zeroxcholy',
      name: 'ZeroX Choly',
      followers_count: 12450,
      following_count: 1234,
      tweet_count: 5678,
      verified: false,
      profile_image_url: 'https://example.com/avatar1.jpg'
    },
    smartFollowers: {
      data: [
        { id: '1', username: 'crypto_influencer', followers_count: 25000, verified: true },
        { id: '2', username: 'web3_dev', followers_count: 12000, verified: true },
        { id: '3', username: 'nft_collector', followers_count: 8500, verified: false },
        { id: '4', username: 'defi_expert', followers_count: 15000, verified: true },
        { id: '5', username: 'blockchain_news', followers_count: 6200, verified: false },
        { id: '6', username: 'crypto_trader', followers_count: 18000, verified: true },
        { id: '7', username: 'web3_founder', followers_count: 22000, verified: true },
        { id: '8', username: 'nft_artist', followers_count: 9500, verified: false },
        { id: '9', username: 'defi_analyst', followers_count: 11000, verified: true },
        { id: '10', username: 'crypto_news', followers_count: 7500, verified: false }
      ],
      meta: { result_count: 10 }
    }
  },
  {
    handle: 'gmwen7',
    profile: {
      id: '987654321',
      username: 'gmwen7',
      name: 'GM Wen',
      followers_count: 8900,
      following_count: 567,
      tweet_count: 3456,
      verified: true,
      profile_image_url: 'https://example.com/avatar2.jpg'
    },
    smartFollowers: {
      data: [
        { id: '11', username: 'ai_researcher', followers_count: 30000, verified: true },
        { id: '12', username: 'tech_innovator', followers_count: 25000, verified: true },
        { id: '13', username: 'startup_founder', followers_count: 18000, verified: true },
        { id: '14', username: 'product_designer', followers_count: 12000, verified: false },
        { id: '15', username: 'ux_expert', followers_count: 15000, verified: true },
        { id: '16', username: 'tech_journalist', followers_count: 22000, verified: true },
        { id: '17', username: 'ai_engineer', followers_count: 16000, verified: true },
        { id: '18', username: 'innovation_expert', followers_count: 19000, verified: true }
      ],
      meta: { result_count: 8 }
    }
  },
  {
    handle: '0xmert_',
    profile: {
      id: '456789123',
      username: '0xmert_',
      name: 'Mert',
      followers_count: 15600,
      following_count: 890,
      tweet_count: 7890,
      verified: false,
      profile_image_url: 'https://example.com/avatar3.jpg'
    },
    smartFollowers: {
      data: [
        { id: '19', username: 'fintech_expert', followers_count: 28000, verified: true },
        { id: '20', username: 'trading_pro', followers_count: 32000, verified: true },
        { id: '21', username: 'macro_analyst', followers_count: 25000, verified: true },
        { id: '22', username: 'equities_trader', followers_count: 18000, verified: false },
        { id: '23', username: 'finance_guru', followers_count: 22000, verified: true },
        { id: '24', username: 'market_analyst', followers_count: 19000, verified: true },
        { id: '25', username: 'investment_expert', followers_count: 26000, verified: true },
        { id: '26', username: 'trading_educator', followers_count: 15000, verified: false },
        { id: '27', username: 'financial_advisor', followers_count: 12000, verified: true },
        { id: '28', username: 'market_researcher', followers_count: 14000, verified: false }
      ],
      meta: { result_count: 10 }
    }
  },
  {
    handle: '0xwenmoon',
    profile: {
      id: '789123456',
      username: '0xwenmoon',
      name: 'Wen Moon',
      followers_count: 8900,
      following_count: 456,
      tweet_count: 2345,
      verified: false,
      profile_image_url: 'https://example.com/avatar4.jpg'
    },
    smartFollowers: {
      data: [
        { id: '29', username: 'nft_curator', followers_count: 16000, verified: true },
        { id: '30', username: 'digital_artist', followers_count: 12000, verified: false },
        { id: '31', username: 'crypto_collector', followers_count: 18000, verified: true },
        { id: '32', username: 'web3_artist', followers_count: 9500, verified: false },
        { id: '33', username: 'nft_investor', followers_count: 14000, verified: true },
        { id: '34', username: 'digital_creator', followers_count: 11000, verified: false },
        { id: '35', username: 'crypto_enthusiast', followers_count: 8500, verified: false },
        { id: '36', username: 'nft_trader', followers_count: 13000, verified: true }
      ],
      meta: { result_count: 8 }
    }
  }
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

// Reputation computation function (same as in the main system)
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
  logSection(`Mock Results for @${handle}`);
  
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

async function testMockAccount(accountData) {
  logHeader(`Testing Mock Account: @${accountData.handle}`);
  
  const repData = computeBasicRep(accountData.profile, accountData.smartFollowers);
  displayResults(accountData.handle, accountData, repData);
  
  return { success: true, repData, data: accountData };
}

async function runMockTests() {
  logHeader('Twitter Arc - Mock Account Reputation Test');
  log(`Testing ${mockAccounts.length} mock accounts with sample data...`, 'blue');
  log('This demonstrates how the reputation system works with realistic data', 'yellow');
  
  const results = [];
  
  for (const accountData of mockAccounts) {
    const result = await testMockAccount(accountData);
    results.push({ account: accountData.handle, ...result });
    
    // Small delay for readability
    if (accountData.handle !== mockAccounts[mockAccounts.length - 1].handle) {
      log('Waiting 1 second before next account...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  logHeader('Mock Test Summary');
  const successful = results.filter(r => r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (successful > 0) {
    console.log('\n📈 Reputation Scores Summary:');
    results.filter(r => r.success).forEach(({ account, repData }) => {
      console.log(`   @${account}: ${repData.score} REP (${repData.qualityScore}% quality)`);
    });
  }
  
  console.log('\n🔍 Analysis:');
  console.log('   • @zeroxcholy: Crypto influencer with high follower count');
  console.log('   • @gmwen7: Verified tech innovator with elite followers');
  console.log('   • @0xmert_: Finance/trading expert with quality audience');
  console.log('   • @0xwenmoon: NFT collector with niche following');
  
  log('\n🎉 Mock test completed!', 'green');
  log('This demonstrates the reputation scoring algorithm with realistic data', 'cyan');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Twitter Arc - Mock Test Script

Usage:
  node test-mock.js [options]

Options:
  --help, -h     Show this help message
  --account, -a  Test a specific mock account (e.g., -a zeroxcholy)

Examples:
  node test-mock.js
  node test-mock.js -a zeroxcholy
`);
  process.exit(0);
}

// Check for specific account argument
const accountArg = process.argv.find(arg => arg.startsWith('--account=') || arg.startsWith('-a='));
if (accountArg) {
  const specificAccount = accountArg.split('=')[1];
  if (specificAccount) {
    const accountData = mockAccounts.find(acc => acc.handle === specificAccount);
    if (accountData) {
      log(`Testing specific mock account: @${specificAccount}`, 'blue');
      testMockAccount(accountData).then(() => {
        log('\n🎉 Single mock account test completed!', 'green');
        process.exit(0);
      }).catch(error => {
        log(`\n❌ Mock test failed: ${error.message}`, 'red');
        process.exit(1);
      });
    } else {
      log(`❌ Mock account @${specificAccount} not found`, 'red');
      process.exit(1);
    }
  }
} else {
  // Run full test suite
  runMockTests().catch(error => {
    log(`\n❌ Mock test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
} 