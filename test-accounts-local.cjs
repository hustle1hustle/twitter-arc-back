const https = require('https');

class TweetScoutAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'api.tweetscout.io';
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/v2${path}`,
        method: 'GET',
        headers: {
          'ApiKey': this.apiKey,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getUser(handle) {
    console.log(`🔍 TweetScout: Fetching info for @${handle}...`);
    return this.makeRequest(`/info/${handle}`);
  }

  async getSmartFollowers(handle) {
    console.log(`🔍 TweetScout: Fetching smart followers for @${handle}...`);
    return this.makeRequest(`/smart_followers/${handle}?page=1`);
  }

  async getSmartMeta(handle) {
    console.log(`🔍 TweetScout: Fetching smart meta for @${handle}...`);
    return this.makeRequest(`/smart_followers/${handle}/meta`);
  }

  async getUserScore(handle) {
    console.log(`🔍 TweetScout: Fetching score for @${handle}...`);
    return this.makeRequest(`/score/${handle}`);
  }
}

function computeReputation(user, smartFollowers, meta, score) {
  const followers = user.followers_count || 0;
  const smartTop = (smartFollowers.smart_followers || []).slice(0, 5)
                   .map(s => `@${s.screen_name}`);
  const smartCount = smartTop.length;
  
  // Возраст аккаунта в годах
  const createdDate = new Date(user.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);

  const repScore = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (smartCount / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * (score?.score || 0) +
    0.10 * ((meta?.avg_smart_score || 0) / 10)
  );

  return {
    rep: repScore,
    followers: followers,
    smartTop,
    smartMedianFollowers: meta?.median_followers || 0,
    smartAvgScore: meta?.avg_smart_score || 0,
    engagementRate: 0, // Нет в API
    avgLikes: 0, // Нет в API
    avgRetweets: 0, // Нет в API
    topHashtags: [], // Нет в API
    topMentions: [], // Нет в API
    source: "tweetscout",
    accountAge: ageYears.toFixed(1),
    verified: user.verified,
    tweetsCount: user.tweets_count
  };
}

async function analyzeAccounts() {
  const handles = ['zeroxcholy', '0xwenmoon', '0xmert_'];
  const apiKey = '3a40c7e0-66b8-4686-81eb-6bdccdbc3797';
  
  console.log('🚀 АНАЛИЗ TWITTER АККАУНТОВ');
  console.log('='.repeat(60));
  console.log('📊 TweetScout API v2');
  console.log('='.repeat(60));

  const tweetscout = new TweetScoutAPI(apiKey);
  const results = [];

  for (const handle of handles) {
    try {
      console.log(`\n📊 Анализирую @${handle}...`);
      console.log('─'.repeat(50));

      const [user, smartFollowers, meta, score] = await Promise.all([
        tweetscout.getUser(handle),
        tweetscout.getSmartFollowers(handle),
        tweetscout.getSmartMeta(handle),
        tweetscout.getUserScore(handle)
      ]);

      if (user.error || smartFollowers.error) {
        console.log(`❌ Ошибка для @${handle}: TweetScout недоступен`);
        continue;
      }

      const reputation = computeReputation(user, smartFollowers, meta, score);

      console.log(`🏆 REP Score: ${reputation.rep}`);
      console.log(`👥 Подписчики: ${reputation.followers?.toLocaleString()}`);
      console.log(`🐦 Твиты: ${reputation.tweetsCount?.toLocaleString()}`);
      console.log(`📅 Возраст аккаунта: ${reputation.accountAge} лет`);
      console.log(`✅ Верифицирован: ${reputation.verified ? 'ДА' : 'НЕТ'}`);
      console.log(`⭐ Smart Top: ${reputation.smartTop.join(', ')}`);
      console.log(`📈 Smart Median: ${reputation.smartMedianFollowers?.toLocaleString()}`);
      console.log(`🎯 Smart Avg Score: ${reputation.smartAvgScore?.toFixed(2)}`);
      console.log(`🏆 TweetScout Score: ${score?.score?.toFixed(2) || 'N/A'}`);

      results.push({ handle, reputation, score });

    } catch (error) {
      console.error(`❌ Ошибка для @${handle}:`, error.message);
    }
  }

  // Сортировка по REP
  results.sort((a, b) => b.reputation.rep - a.reputation.rep);

  console.log('\n🏆 ИТОГОВЫЙ РЕЙТИНГ');
  console.log('='.repeat(60));
  results.forEach((result, index) => {
    console.log(`${index + 1}. @${result.handle} - ${result.reputation.rep} REP (${result.reputation.followers?.toLocaleString()} followers)`);
  });

  console.log('\n📊 СТАТИСТИКА');
  console.log('='.repeat(60));
  const avgRep = results.reduce((sum, r) => sum + r.reputation.rep, 0) / results.length;
  const avgFollowers = results.reduce((sum, r) => sum + (r.reputation.followers || 0), 0) / results.length;
  console.log(`Средний REP: ${Math.round(avgRep)}`);
  console.log(`Средние подписчики: ${Math.round(avgFollowers).toLocaleString()}`);
  console.log(`Максимальный REP: ${Math.max(...results.map(r => r.reputation.rep))}`);
  console.log(`Минимальный REP: ${Math.min(...results.map(r => r.reputation.rep))}`);
}

analyzeAccounts().catch(console.error); 