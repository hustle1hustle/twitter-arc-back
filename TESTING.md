# Twitter Arc - Testing Guide

This guide covers how to test the Twitter Arc reputation system with real Twitter accounts.

## 🧪 Test Scripts

### 1. Basic Reputation Test (`test-accounts.js`)

Tests basic reputation computation using TweetScout API only.

**Usage:**
```bash
# Test all accounts
npm run test:accounts

# Test specific account
npm run test:account=zeroxcholy

# Direct usage
node test-accounts.js
node test-accounts.js -a zeroxcholy
```

**Features:**
- ✅ Fetches user profiles from TweetScout
- ✅ Fetches smart followers data
- ✅ Computes basic reputation scores
- ✅ Displays detailed results with colors
- ✅ Shows sample smart followers
- ✅ Rate limiting (2-second delays)

### 2. Worker Module Test (`test-worker.js`)

Tests full reputation computation including out-of-crypto circle data.

**Usage:**
```bash
# Test all accounts with worker module
npm run test:worker

# Test specific account
npm run test:worker:account=zeroxcholy

# Direct usage
node test-worker.js
node test-worker.js -a zeroxcholy
```

**Features:**
- ✅ All basic features from test-accounts.js
- ✅ Out-of-crypto circle data (SparkToro, Audiense, HypeAuditor)
- ✅ Non-crypto bonus computation
- ✅ Enhanced reputation scoring
- ✅ Detailed out-of-crypto analysis
- ✅ Rate limiting (3-second delays)

## 📊 Test Accounts

The scripts test these accounts by default:

1. **@zeroxcholy** - Crypto influencer
2. **@gmwen7** - Web3 developer
3. **@0xmert_** - Crypto trader
4. **@0xwenmoon** - NFT collector

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Required
TWEETSCOUT_KEY=YOUR_TS_KEY

# Optional (for worker test)
SPARKTORO_API_KEY=your_sparktoro_key
AUDIENSE_API_KEY=your_audiense_key
HYPEAUDITOR_API_KEY=your_hypeauditor_key
```

### Setup Instructions

1. **Copy environment file:**
   ```bash
   cp env.local.example .env.local
   ```

2. **Set your API keys** in `.env.local`

3. **Run tests:**
   ```bash
   # Basic test
   npm run test:accounts
   
   # Full worker test
   npm run test:worker
   ```

## 📈 Understanding Results

### Basic Reputation Score

The basic reputation computation includes:

- **Base Score**: Logarithmic scale based on follower count
- **Quality Multiplier**: Based on verified followers ratio
- **Blue Check Bonus**: +50 REP for verified accounts
- **Engagement Bonus**: Based on follower count

### Worker Reputation Score

The worker adds these bonuses:

- **Non-Crypto Bonus**: +6 REP for AI/tech keywords in bio
- **Audience Interests**: +3 REP per relevant segment
- **Expert Lists**: +5 REP per expert list membership
- **Audience Quality**: +10 REP (90%+), +5 REP (80%+), -10 REP (<70%)

### Badges

- **Verified**: Account has blue check
- **High Quality**: >30% verified followers
- **Influencer**: >10K followers
- **Elite**: >50% verified followers
- **Non-Crypto**: Contains AI/tech keywords
- **Diverse Audience**: Relevant audience interests
- **Expert Network**: Member of expert lists
- **High Quality Audience**: 90%+ audience quality

## 🎯 Sample Output

```
============================================================
Testing Account: @zeroxcholy
============================================================

📡 Fetching data from all sources...
✓ Profile fetched: zeroxcholy (@zeroxcholy)
✓ Smart followers fetched: 45 followers

----------------------------------------
Results for @zeroxcholy
----------------------------------------

📊 Profile Information:
   Name: zeroxcholy
   Username: @zeroxcholy
   Followers: 12,450
   Following: 1,234
   Tweets: 5,678
   Verified: ❌ No

🎯 Reputation Analysis:
   REP Score: 847
   Quality Score: 67%
   Verified Ratio: 67.0%
   Smart Followers: 45
   Verified Followers: 30

🏷️  Badges: [High Quality] [Influencer]

👥 Sample Smart Followers:
   1. @crypto_influencer ✅ (25,000 followers)
   2. @web3_dev ✅ (12,000 followers)
   3. @nft_collector ❌ (8,500 followers)
   4. @defi_expert ✅ (15,000 followers)
   5. @blockchain_news ❌ (6,200 followers)
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   # Check if API key is set
   echo $TWEETSCOUT_KEY
   
   # Set API key temporarily
   export TWEETSCOUT_KEY=your_key
   ```

2. **Rate Limiting**
   - Scripts include delays between requests
   - If you hit limits, increase delays in the scripts

3. **Account Not Found**
   - Verify account handles are correct
   - Some accounts may be private or suspended

4. **Network Issues**
   - Check your internet connection
   - Try running tests individually

### Debug Mode

Add debug logging by modifying the scripts:

```javascript
// Add to test-accounts.js or test-worker.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug: API response:', response);
}
```

Then run with:
```bash
DEBUG=true npm run test:accounts
```

## 📝 Adding New Test Accounts

To test different accounts, modify the `accounts` array in either script:

```javascript
const accounts = [
  'your_account_1',
  'your_account_2',
  'your_account_3'
];
```

Or use the command line:
```bash
node test-accounts.js -a your_account
```

## 🚀 Next Steps

After testing:

1. **Deploy to production** with verified API keys
2. **Monitor performance** and adjust rate limits
3. **Add more test accounts** for comprehensive validation
4. **Implement caching** for frequently accessed accounts
5. **Add automated testing** to CI/CD pipeline

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your API keys are valid
3. Check the Twitter Arc documentation
4. Review the error messages for specific guidance 