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
    accountAge: ageYears.toFixed(1),
    verified: user.verified,
    tweetsCount: user.tweets_count,
    source: "tweetscout"
  };
}

function analyzeAccountType(followers, verified, ageYears) {
  if (followers >= 100000) return "Celebrity";
  if (followers >= 10000) return "Influencer";
  if (followers >= 1000) return "Regular";
  return "Newcomer";
}

function analyzeEngagementLevel(tweetsCount, followers, ageYears) {
  const tweetsPerYear = tweetsCount / ageYears;
  const tweetsPerFollower = followers > 0 ? tweetsCount / followers : 0;
  
  if (tweetsPerYear > 10000) return "Ultra Active";
  if (tweetsPerYear > 5000) return "Very Active";
  if (tweetsPerYear > 1000) return "Active";
  if (tweetsPerYear > 100) return "Moderate";
  return "Low Activity";
}

function getSmartFollowersAnalysis(smartFollowers) {
  const followers = smartFollowers.smart_followers || [];
  const verifiedCount = followers.filter(f => f.verified).length;
  const totalCount = followers.length;
  const verifiedRatio = totalCount > 0 ? verifiedCount / totalCount : 0;
  
  return {
    total: totalCount,
    verified: verifiedCount,
    verifiedRatio: verifiedRatio.toFixed(2),
    quality: verifiedRatio > 0.3 ? "High" : verifiedRatio > 0.1 ? "Medium" : "Low"
  };
}

function generateInsights(user, reputation, smartAnalysis, score) {
  const insights = [];
  
  // Анализ размера аудитории
  if (user.followers_count >= 100000) {
    insights.push("🎯 Массовая аудитория - один из крупнейших аккаунтов");
  } else if (user.followers_count >= 10000) {
    insights.push("📈 Растущее влияние - значительная аудитория");
  }
  
  // Анализ активности
  const tweetsPerYear = user.tweets_count / parseFloat(reputation.accountAge);
  if (tweetsPerYear > 10000) {
    insights.push("🔥 Ультра-активный - очень высокая активность");
  } else if (tweetsPerYear > 5000) {
    insights.push("⚡ Высокая активность - регулярные публикации");
  } else if (tweetsPerYear < 100) {
    insights.push("📝 Низкая активность - редкие публикации");
  }
  
  // Анализ верификации
  if (user.verified) {
    insights.push("✅ Верифицированный - подтвержденная авторитетность");
  }
  
  // Анализ TweetScout Score
  if (score?.score > 2000) {
    insights.push("🏆 Elite TweetScout Score - исключительное качество");
  } else if (score?.score > 1000) {
    insights.push("⭐ High TweetScout Score - высокое качество");
  }
  
  // Анализ умных подписчиков
  if (smartAnalysis.quality === "High") {
    insights.push("👑 Качественная аудитория - много верифицированных подписчиков");
  }
  
  // Анализ возраста
  if (parseFloat(reputation.accountAge) > 5) {
    insights.push("🕰️ Ветеран Twitter - долгосрочное присутствие");
  }
  
  return insights;
}

async function enhancedAnalysis() {
  const handles = ['zeroxcholy', '0xwenmoon', '0xmert_'];
  const apiKey = '3a40c7e0-66b8-4686-81eb-6bdccdbc3797';
  
  console.log('🚀 РАСШИРЕННЫЙ АНАЛИЗ TWITTER АККАУНТОВ');
  console.log('='.repeat(80));
  console.log('📊 TweetScout API v2 + Расширенная аналитика');
  console.log('='.repeat(80));

  const tweetscout = new TweetScoutAPI(apiKey);
  const results = [];

  for (const handle of handles) {
    try {
      console.log(`\n📊 АНАЛИЗ @${handle}`);
      console.log('═'.repeat(60));

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
      const accountType = analyzeAccountType(user.followers_count, user.verified, parseFloat(reputation.accountAge));
      const engagementLevel = analyzeEngagementLevel(user.tweets_count, user.followers_count, parseFloat(reputation.accountAge));
      const smartAnalysis = getSmartFollowersAnalysis(smartFollowers);
      const insights = generateInsights(user, reputation, smartAnalysis, score);

      console.log(`🏆 REP Score: ${reputation.rep}`);
      console.log(`👥 Подписчики: ${reputation.followers?.toLocaleString()}`);
      console.log(`🐦 Твиты: ${reputation.tweetsCount?.toLocaleString()}`);
      console.log(`📅 Возраст аккаунта: ${reputation.accountAge} лет`);
      console.log(`✅ Верифицирован: ${reputation.verified ? 'ДА' : 'НЕТ'}`);
      console.log(`🏷️ Тип аккаунта: ${accountType}`);
      console.log(`⚡ Уровень активности: ${engagementLevel}`);
      
      console.log(`\n📊 УМНЫЕ ПОДПИСЧИКИ:`);
      console.log(`   Всего: ${smartAnalysis.total}`);
      console.log(`   Верифицированных: ${smartAnalysis.verified}`);
      console.log(`   Соотношение: ${smartAnalysis.verifiedRatio}`);
      console.log(`   Качество: ${smartAnalysis.quality}`);
      
      if (reputation.smartTop.length > 0) {
        console.log(`   Топ-5: ${reputation.smartTop.join(', ')}`);
      }
      
      console.log(`\n📈 МЕТРИКИ:`);
      console.log(`   Smart Median: ${reputation.smartMedianFollowers?.toLocaleString()}`);
      console.log(`   Smart Avg Score: ${reputation.smartAvgScore?.toFixed(2)}`);
      console.log(`   TweetScout Score: ${score?.score?.toFixed(2) || 'N/A'}`);
      
      console.log(`\n💡 ИНСАЙТЫ:`);
      insights.forEach(insight => console.log(`   • ${insight}`));

      results.push({ 
        handle, 
        reputation, 
        accountType, 
        engagementLevel, 
        smartAnalysis, 
        insights,
        score 
      });

    } catch (error) {
      console.error(`❌ Ошибка для @${handle}:`, error.message);
    }
  }

  // Сортировка по REP
  results.sort((a, b) => b.reputation.rep - a.reputation.rep);

  console.log('\n🏆 ИТОГОВЫЙ РЕЙТИНГ');
  console.log('═'.repeat(80));
  results.forEach((result, index) => {
    console.log(`${index + 1}. @${result.handle}`);
    console.log(`   REP: ${result.reputation.rep} | Followers: ${result.reputation.followers?.toLocaleString()}`);
    console.log(`   Type: ${result.accountType} | Activity: ${result.engagementLevel}`);
    console.log(`   TweetScout: ${result.score?.score?.toFixed(2) || 'N/A'}`);
    console.log('');
  });

  console.log('\n📊 СТАТИСТИКА');
  console.log('═'.repeat(80));
  const avgRep = results.reduce((sum, r) => sum + r.reputation.rep, 0) / results.length;
  const avgFollowers = results.reduce((sum, r) => sum + (r.reputation.followers || 0), 0) / results.length;
  const avgTweetScout = results.reduce((sum, r) => sum + (r.score?.score || 0), 0) / results.length;
  
  console.log(`Средний REP: ${Math.round(avgRep)}`);
  console.log(`Средние подписчики: ${Math.round(avgFollowers).toLocaleString()}`);
  console.log(`Средний TweetScout Score: ${avgTweetScout.toFixed(2)}`);
  console.log(`Максимальный REP: ${Math.max(...results.map(r => r.reputation.rep))}`);
  console.log(`Минимальный REP: ${Math.min(...results.map(r => r.reputation.rep))}`);
  
  console.log('\n🏷️ РАСПРЕДЕЛЕНИЕ ПО ТИПАМ:');
  const typeCount = {};
  results.forEach(r => {
    typeCount[r.accountType] = (typeCount[r.accountType] || 0) + 1;
  });
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  console.log('\n⚡ РАСПРЕДЕЛЕНИЕ ПО АКТИВНОСТИ:');
  const activityCount = {};
  results.forEach(r => {
    activityCount[r.engagementLevel] = (activityCount[r.engagementLevel] || 0) + 1;
  });
  Object.entries(activityCount).forEach(([activity, count]) => {
    console.log(`   ${activity}: ${count}`);
  });
}

enhancedAnalysis().catch(console.error); 