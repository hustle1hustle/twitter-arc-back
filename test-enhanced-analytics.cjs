const https = require('https')

// TweetScout API
class TweetScoutAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'api.tweetscout.io'
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
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.end()
    })
  }

  async getUser(handle) {
    try {
      console.log(`🔍 TweetScout: Fetching info for @${handle}...`)
      return await this.makeRequest(`/info/${handle}`)
    } catch (error) {
      throw new Error(`TweetScout API error for user ${handle}: ${error.message}`)
    }
  }

  async getUserScore(handle) {
    try {
      console.log(`🔍 TweetScout: Fetching score for @${handle}...`)
      return await this.makeRequest(`/score/${handle}`)
    } catch (error) {
      console.log(`⚠️ TweetScout score not available for @${handle}`)
      return null
    }
  }
}

// Twitter API v2
class TwitterAPI {
  constructor(bearerToken) {
    this.bearerToken = bearerToken
    this.baseUrl = 'api.twitter.com'
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/2${path}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.end()
    })
  }

  async getUserByUsername(username) {
    try {
      console.log(`🐦 Twitter API: Fetching data for @${username}...`)
      const response = await this.makeRequest(`/users/by/username/${username}?user.fields=id,name,username,description,public_metrics,verified,created_at,profile_image_url,url`)
      return response.data
    } catch (error) {
      console.log(`⚠️ Twitter API data not available for @${username}: ${error.message}`)
      return null
    }
  }

  async getUserTweets(userId, maxResults = 10) {
    try {
      console.log(`🐦 Twitter API: Fetching recent tweets for user ${userId}...`)
      const response = await this.makeRequest(`/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,lang`)
      return response.data || []
    } catch (error) {
      console.log(`⚠️ Twitter API tweets not available for user ${userId}`)
      return []
    }
  }
}

// Enhanced Analytics Service
class EnhancedAnalyticsService {
  constructor(tweetscout, twitter) {
    this.tweetscout = tweetscout
    this.twitter = twitter
  }

  async analyzeUser(handle) {
    try {
      console.log(`\n📊 Анализирую @${handle}...`)
      console.log('='.repeat(50))

      // Get TweetScout data
      const tweetScoutUser = await this.tweetscout.getUser(handle)
      const tweetScoutScore = await this.tweetscout.getUserScore(handle)

      // Get Twitter API data
      const twitterUser = await this.twitter.getUserByUsername(handle)
      let recentTweets = []
      if (twitterUser) {
        recentTweets = await this.twitter.getUserTweets(twitterUser.id)
      }

      // Calculate reputation
      const reputation = this.computeReputation(tweetScoutUser, tweetScoutScore, twitterUser, recentTweets)

      // Generate insights
      const insights = this.generateInsights(tweetScoutUser, tweetScoutScore, twitterUser, recentTweets, reputation)

      return {
        handle,
        tweetScout: {
          user: tweetScoutUser,
          score: tweetScoutScore
        },
        twitter: {
          user: twitterUser,
          recentTweets
        },
        reputation,
        insights
      }
    } catch (error) {
      throw new Error(`Ошибка анализа пользователя ${handle}: ${error.message}`)
    }
  }

  computeReputation(tweetScoutUser, tweetScoutScore, twitterUser, recentTweets) {
    const followerCount = tweetScoutUser.followers_count || 0
    const tweetCount = tweetScoutUser.tweets_count || 0
    const isVerified = tweetScoutUser.verified || false
    const createdAt = tweetScoutUser.register_date

    // Calculate account age
    let accountAgeDays = 0
    if (createdAt) {
      const createdDate = new Date(createdAt)
      const now = new Date()
      accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    }

    // TweetScout score - DIRECT IMPACT (1 point = 1 REP)
    const tweetScoutScoreValue = tweetScoutScore?.score || 0
    const tweetScoutBonus = Math.round(tweetScoutScoreValue)

    // Base reputation calculation
    const baseScore = Math.log10(followerCount + 1) * 100
    const ageBonus = Math.min(accountAgeDays / 365, 50)
    const verificationBonus = isVerified ? 50 : 0
    const engagementRate = followerCount > 0 ? (tweetCount / followerCount) * 1000 : 0
    const engagementBonus = Math.min(engagementRate, 50)

    // Twitter API engagement analysis
    let twitterEngagementBonus = 0
    if (recentTweets.length > 0) {
      const avgLikes = recentTweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0) / recentTweets.length
      const avgRetweets = recentTweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.retweet_count || 0), 0) / recentTweets.length
      const avgReplies = recentTweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.reply_count || 0), 0) / recentTweets.length
      
      twitterEngagementBonus = Math.min((avgLikes + avgRetweets * 2 + avgReplies * 3) / followerCount * 1000, 100)
    }

    // Calculate final score
    const finalScore = Math.round(baseScore + ageBonus + verificationBonus + tweetScoutBonus + engagementBonus + twitterEngagementBonus)
    const qualityScore = finalScore * (0.5 + (tweetScoutScoreValue / 200))

    return {
      score: finalScore,
      qualityScore: Math.round(qualityScore),
      followerCount,
      tweetCount,
      isVerified,
      accountAgeDays,
      tweetScoutScore: tweetScoutScoreValue,
      twitterEngagementBonus,
      breakdown: {
        baseScore: Math.round(baseScore),
        ageBonus: Math.round(ageBonus),
        verificationBonus,
        engagementBonus: Math.round(engagementBonus),
        tweetScoutBonus,
        twitterEngagementBonus: Math.round(twitterEngagementBonus)
      }
    }
  }

  generateInsights(tweetScoutUser, tweetScoutScore, twitterUser, recentTweets, reputation) {
    const strengths = []
    const weaknesses = []
    const recommendations = []
    const metrics = {}

    // TweetScout insights
    if (tweetScoutUser.verified) strengths.push('✅ Верифицированный аккаунт')
    if (reputation.accountAgeDays > 365) strengths.push('✅ Долгосрочный аккаунт')
    if (reputation.tweetScoutScore > 50) strengths.push(`✅ Высокий TweetScout рейтинг (${Math.round(reputation.tweetScoutScore)})`)
    if (reputation.followerCount > 10000) strengths.push('✅ Крупная аудитория')

    // Twitter API insights
    if (twitterUser) {
      const twitterMetrics = twitterUser.public_metrics
      metrics.twitter = {
        followers: twitterMetrics.followers_count,
        following: twitterMetrics.following_count,
        tweetCount: twitterMetrics.tweet_count,
        listedCount: twitterMetrics.listed_count
      }

      if (twitterMetrics.listed_count > 100) strengths.push('✅ Высокий рейтинг в списках')
      if (recentTweets.length > 0) {
        const avgLikes = recentTweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0) / recentTweets.length
        const avgRetweets = recentTweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.retweet_count || 0), 0) / recentTweets.length
        
        metrics.engagement = {
          avgLikes: Math.round(avgLikes),
          avgRetweets: Math.round(avgRetweets),
          engagementRate: followerCount > 0 ? ((avgLikes + avgRetweets) / reputation.followerCount * 100) : 0
        }

        if (avgLikes > 100) strengths.push('✅ Высокая вовлеченность (лайки)')
        if (avgRetweets > 50) strengths.push('✅ Высокая виральность (ретвиты)')
      }
    }

    // Weaknesses and recommendations
    if (reputation.followerCount < 1000) {
      weaknesses.push('⚠️ Мало подписчиков')
      recommendations.push('💡 Работать над привлечением аудитории')
    }
    if (reputation.tweetCount < 100) {
      weaknesses.push('⚠️ Мало твитов')
      recommendations.push('💡 Увеличить активность в Twitter')
    }
    if (reputation.accountAgeDays < 30) {
      weaknesses.push('⚠️ Новый аккаунт')
      recommendations.push('💡 Построить историю активности')
    }

    return {
      strengths,
      weaknesses,
      recommendations,
      metrics
    }
  }

  async analyzeMultipleUsers(handles) {
    const users = []
    
    for (const handle of handles) {
      try {
        const user = await this.analyzeUser(handle)
        users.push(user)
      } catch (error) {
        console.error(`❌ Ошибка при анализе @${handle}:`, error.message)
      }
    }

    if (users.length === 0) {
      throw new Error('Не удалось проанализировать ни одного пользователя')
    }

    // Rankings
    const byFollowers = users
      .map(u => ({ handle: u.handle, followers: u.reputation.followerCount }))
      .sort((a, b) => b.followers - a.followers)

    const byReputation = users
      .map(u => ({ handle: u.handle, score: u.reputation.score }))
      .sort((a, b) => b.score - a.score)

    const byQuality = users
      .map(u => ({ handle: u.handle, qualityScore: u.reputation.qualityScore }))
      .sort((a, b) => b.qualityScore - a.qualityScore)

    const byTweetScout = users
      .map(u => ({ handle: u.handle, score: u.reputation.tweetScoutScore }))
      .sort((a, b) => b.score - a.score)

    // Update rankings
    users.forEach(user => {
      user.ranking = {
        followers: byFollowers.findIndex(u => u.handle === user.handle) + 1,
        reputation: byReputation.findIndex(u => u.handle === user.handle) + 1,
        quality: byQuality.findIndex(u => u.handle === user.handle) + 1,
        tweetScout: byTweetScout.findIndex(u => u.handle === user.handle) + 1
      }
    })

    return {
      users,
      summary: {
        totalUsers: users.length,
        averageFollowers: users.reduce((sum, u) => sum + u.reputation.followerCount, 0) / users.length,
        averageReputation: users.reduce((sum, u) => sum + u.reputation.score, 0) / users.length,
        topPerformer: byFollowers[0]?.handle || '',
        mostEngaged: byReputation[0]?.handle || '',
        highestQuality: byQuality[0]?.handle || '',
        bestTweetScout: byTweetScout[0]?.handle || ''
      },
      rankings: {
        byFollowers,
        byReputation,
        byQuality,
        byTweetScout
      }
    }
  }
}

async function generateEnhancedReport() {
  const handles = ['zeroxcholy', '0xwenmoon', '0xmert_']
  
  console.log('🚀 ЗАПУСК РАСШИРЕННОГО АНАЛИЗА')
  console.log('='.repeat(60))
  console.log('📊 TweetScout + Twitter API v2')
  console.log('='.repeat(60))
  
  try {
    const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY)
    const twitter = new TwitterAPI(process.env.TWITTER_BEARER_TOKEN || 'dummy')
    const analyticsService = new EnhancedAnalyticsService(tweetscout, twitter)
    
    const analysis = await analyticsService.analyzeMultipleUsers(handles)
    
    // Print summary
    console.log('\n📊 ОБЩАЯ СТАТИСТИКА')
    console.log('='.repeat(60))
    console.log(`Всего пользователей: ${analysis.summary.totalUsers}`)
    console.log(`Среднее количество подписчиков: ${Math.round(analysis.summary.averageFollowers).toLocaleString()}`)
    console.log(`Средний репутационный балл: ${Math.round(analysis.summary.averageReputation)}`)
    console.log(`🏆 Лучший по подписчикам: @${analysis.summary.topPerformer}`)
    console.log(`⭐ Лучший по репутации: @${analysis.summary.mostEngaged}`)
    console.log(`🎯 Лучший по качеству: @${analysis.summary.highestQuality}`)
    console.log(`🔍 Лучший TweetScout: @${analysis.summary.bestTweetScout}`)
    
    // Print rankings
    console.log('\n🏆 РАНЖИРОВАНИЕ ПО ПОДПИСЧИКАМ')
    console.log('='.repeat(60))
    analysis.rankings.byFollowers.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${user.followers.toLocaleString()} подписчиков`)
    })
    
    console.log('\n⭐ РАНЖИРОВАНИЕ ПО РЕПУТАЦИИ')
    console.log('='.repeat(60))
    analysis.rankings.byReputation.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${Math.round(user.score)} баллов`)
    })
    
    console.log('\n🔍 РАНЖИРОВАНИЕ ПО TWEETSCOUT')
    console.log('='.repeat(60))
    analysis.rankings.byTweetScout.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${Math.round(user.score)} баллов`)
    })
    
    // Print detailed analysis
    console.log('\n📋 ДЕТАЛЬНЫЙ АНАЛИЗ ПОЛЬЗОВАТЕЛЕЙ')
    console.log('='.repeat(60))
    
    analysis.users.forEach(user => {
      console.log(`\n👤 @${user.handle}`)
      console.log(`   Имя: ${user.tweetScout.user.name}`)
      console.log(`   Подписчики: ${user.reputation.followerCount.toLocaleString()}`)
      console.log(`   Твиты: ${user.reputation.tweetCount.toLocaleString()}`)
      console.log(`   Верифицирован: ${user.reputation.isVerified ? '✅' : '❌'}`)
      console.log(`   Возраст аккаунта: ${user.reputation.accountAgeDays} дней`)
      console.log(`   TweetScout рейтинг: ${Math.round(user.reputation.tweetScoutScore)}`)
      console.log(`   Общая репутация: ${Math.round(user.reputation.score)} баллов`)
      console.log(`   Качество: ${Math.round(user.reputation.qualityScore)} баллов`)
      
      // Breakdown
      console.log(`   📊 Разбор репутации:`)
      console.log(`      • Базовая оценка: ${user.reputation.breakdown.baseScore}`)
      console.log(`      • Бонус за возраст: ${user.reputation.breakdown.ageBonus}`)
      console.log(`      • Бонус за верификацию: ${user.reputation.breakdown.verificationBonus}`)
      console.log(`      • Бонус за вовлеченность: ${user.reputation.breakdown.engagementBonus}`)
      console.log(`      • TweetScout бонус: ${user.reputation.breakdown.tweetScoutBonus}`)
      console.log(`      • Twitter API бонус: ${user.reputation.breakdown.twitterEngagementBonus}`)
      
      // Rankings
      console.log(`   🏆 Ранги:`)
      console.log(`      • По подписчикам: ${user.ranking.followers}/${analysis.users.length}`)
      console.log(`      • По репутации: ${user.ranking.reputation}/${analysis.users.length}`)
      console.log(`      • По качеству: ${user.ranking.quality}/${analysis.users.length}`)
      console.log(`      • По TweetScout: ${user.ranking.tweetScout}/${analysis.users.length}`)
      
      // Insights
      if (user.insights.strengths.length > 0) {
        console.log(`   💪 Сильные стороны:`)
        user.insights.strengths.forEach(strength => console.log(`      • ${strength}`))
      }
      
      if (user.insights.weaknesses.length > 0) {
        console.log(`   ⚠️  Слабые стороны:`)
        user.insights.weaknesses.forEach(weakness => console.log(`      • ${weakness}`))
      }
      
      if (user.insights.recommendations.length > 0) {
        console.log(`   💡 Рекомендации:`)
        user.insights.recommendations.forEach(rec => console.log(`      • ${rec}`))
      }
    })
    
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message)
  }
}

// Запускаем расширенный отчет
generateEnhancedReport() 