const https = require('https')

// Простая версия TweetScout API
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
            console.log(`📡 API Response for ${path}:`, JSON.stringify(jsonData, null, 2))
            resolve(jsonData)
          } catch (error) {
            console.error(`❌ Invalid JSON for ${path}:`, data)
            reject(new Error(`Invalid JSON response: ${data}`))
          }
        })
      })

      req.on('error', (error) => {
        console.error(`❌ Request error for ${path}:`, error.message)
        reject(error)
      })

      req.end()
    })
  }

  async getUser(handle) {
    try {
      console.log(`🔍 Fetching user info for @${handle}...`)
      return await this.makeRequest(`/info/${handle}`)
    } catch (error) {
      throw new Error(`TweetScout API error for user ${handle}: ${error.message}`)
    }
  }

  async getUserScore(handle) {
    try {
      console.log(`🔍 Fetching user score for @${handle}...`)
      return await this.makeRequest(`/score/${handle}`)
    } catch (error) {
      console.log(`⚠️ Score not available for @${handle}: ${error.message}`)
      return null
    }
  }

  async getSmartFollowers(handle, page = 1) {
    try {
      console.log(`🔍 Fetching smart followers for @${handle}...`)
      return await this.makeRequest(`/user/${handle}/smartFollowers?page=${page}`)
    } catch (error) {
      console.log(`⚠️ Smart followers not available for @${handle}: ${error.message}`)
      return { data: [] }
    }
  }
}

// Упрощенная функция вычисления репутации
function computeRep(user, score, smartFollowers) {
  console.log(`📊 Computing reputation for user with ${user.followers_count} followers`)
  
  const followerCount = user.followers_count || 0
  const tweetCount = user.tweets_count || 0
  const isVerified = user.verified || false
  const createdAt = user.register_date

  // Calculate account age
  let accountAgeDays = 0
  if (createdAt) {
    const createdDate = new Date(createdAt)
    const now = new Date()
    accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
  }

  // TweetScout score - DIRECT IMPACT (1 point = 1 REP)
  const tweetScoutScore = score?.score || 0
  const tweetScoutBonus = Math.round(tweetScoutScore)

  // Base reputation calculation
  const baseScore = Math.log10(followerCount + 1) * 100
  const ageBonus = Math.min(accountAgeDays / 365, 50)
  const verificationBonus = isVerified ? 50 : 0
  const engagementRate = followerCount > 0 ? (tweetCount / followerCount) * 1000 : 0
  const engagementBonus = Math.min(engagementRate, 50)

  // Calculate final score
  const finalScore = Math.round(baseScore + ageBonus + verificationBonus + tweetScoutBonus + engagementBonus)
  const qualityScore = finalScore * (0.5 + (tweetScoutScore / 200)) // Quality based on TweetScout score

  return {
    score: finalScore,
    qualityScore: Math.round(qualityScore),
    followerCount,
    tweetCount,
    isVerified,
    accountAgeDays,
    tweetScoutScore,
    badges: [],
    description: '',
    nonCryptoBonus: 0
  }
}

// Сервис аналитики
class UserAnalyticsService {
  constructor(tweetscout) {
    this.tweetscout = tweetscout
  }

  async analyzeUser(handle) {
    try {
      console.log(`📊 Анализирую @${handle}...`)
      const user = await this.tweetscout.getUser(handle)
      const score = await this.tweetscout.getUserScore(handle)
      const smartFollowers = await this.tweetscout.getSmartFollowers(handle)
      const reputation = computeRep(user, score, smartFollowers)

      const followerCount = user.followers_count || 0
      const followingCount = user.following_count || 0
      const tweetCount = user.tweets_count || 0
      const isVerified = user.verified || false

      const followerToFollowingRatio = followingCount > 0 ? followerCount / followingCount : 0
      const tweetToFollowerRatio = followerCount > 0 ? tweetCount / followerCount : 0

      const strengths = []
      const weaknesses = []
      const recommendations = []

      if (isVerified) strengths.push('Верифицированный аккаунт')
      if (reputation.accountAgeDays > 365) strengths.push('Долгосрочный аккаунт')
      if (followerToFollowingRatio > 2) strengths.push('Хорошее соотношение подписчиков/подписок')
      if (reputation.tweetScoutScore > 50) strengths.push('Высокий TweetScout рейтинг')

      if (followerCount < 1000) {
        weaknesses.push('Мало подписчиков')
        recommendations.push('Работать над привлечением аудитории')
      }
      if (followerToFollowingRatio < 0.5) {
        weaknesses.push('Много подписок при малом количестве подписчиков')
        recommendations.push('Сфокусироваться на создании качественного контента')
      }
      if (tweetCount < 100) {
        weaknesses.push('Мало твитов')
        recommendations.push('Увеличить активность в Twitter')
      }
      if (reputation.accountAgeDays < 30) {
        weaknesses.push('Новый аккаунт')
        recommendations.push('Построить историю активности')
      }

      return {
        handle,
        basicInfo: {
          name: user.name || 'Unknown',
          followers: followerCount,
          following: followingCount,
          tweets: tweetCount,
          verified: isVerified,
          profileImage: user.profile_image_url || '',
          accountAge: reputation.accountAgeDays
        },
        reputation,
        audienceAnalysis: {
          verifiedFollowers: 0, // Not available in basic API
          totalFollowers: 0,
          verifiedRatio: 0,
          topFollowers: []
        },
        engagementMetrics: {
          followerToFollowingRatio,
          tweetToFollowerRatio,
          accountAge: reputation.accountAgeDays
        },
        comparativeRanking: {
          followerRank: 0,
          reputationRank: 0,
          qualityRank: 0
        },
        insights: {
          strengths,
          weaknesses,
          recommendations
        }
      }
    } catch (error) {
      throw new Error(`Ошибка анализа пользователя ${handle}: ${error.message}`)
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
        // Продолжаем с другими пользователями
      }
    }

    if (users.length === 0) {
      throw new Error('Не удалось проанализировать ни одного пользователя')
    }

    const byFollowers = users
      .map(u => ({ handle: u.handle, followers: u.basicInfo.followers }))
      .sort((a, b) => b.followers - a.followers)

    const byReputation = users
      .map(u => ({ handle: u.handle, score: u.reputation.score }))
      .sort((a, b) => b.score - a.score)

    const byQuality = users
      .map(u => ({ handle: u.handle, qualityScore: u.reputation.qualityScore }))
      .sort((a, b) => b.qualityScore - a.qualityScore)

    users.forEach(user => {
      user.comparativeRanking.followerRank = byFollowers.findIndex(u => u.handle === user.handle) + 1
      user.comparativeRanking.reputationRank = byReputation.findIndex(u => u.handle === user.handle) + 1
      user.comparativeRanking.qualityRank = byQuality.findIndex(u => u.handle === user.handle) + 1
    })

    const totalFollowers = users.reduce((sum, u) => sum + u.basicInfo.followers, 0)
    const totalReputation = users.reduce((sum, u) => sum + u.reputation.score, 0)
    const averageFollowers = totalFollowers / users.length
    const averageReputation = totalReputation / users.length

    return {
      users,
      summary: {
        totalUsers: users.length,
        averageFollowers,
        averageReputation,
        topPerformer: byFollowers[0]?.handle || '',
        mostEngaged: byReputation[0]?.handle || '',
        highestQuality: byQuality[0]?.handle || ''
      },
      rankings: {
        byFollowers,
        byReputation,
        byQuality
      }
    }
  }
}

async function generateUserReport() {
  const handles = ['zeroxcholy', '0xwenmoon', '0xmert_']
  
  console.log('🔍 Анализ пользователей...')
  console.log('='.repeat(50))
  
  try {
    const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY)
    const analyticsService = new UserAnalyticsService(tweetscout)
    const analysis = await analyticsService.analyzeMultipleUsers(handles)
    
    console.log('\n📊 ОБЩАЯ СТАТИСТИКА')
    console.log('='.repeat(50))
    console.log(`Всего пользователей: ${analysis.summary.totalUsers}`)
    console.log(`Среднее количество подписчиков: ${Math.round(analysis.summary.averageFollowers).toLocaleString()}`)
    console.log(`Средний репутационный балл: ${Math.round(analysis.summary.averageReputation)}`)
    console.log(`Лучший по подписчикам: @${analysis.summary.topPerformer}`)
    console.log(`Лучший по репутации: @${analysis.summary.mostEngaged}`)
    console.log(`Лучший по качеству: @${analysis.summary.highestQuality}`)
    
    console.log('\n🏆 РАНЖИРОВАНИЕ ПО ПОДПИСЧИКАМ')
    console.log('='.repeat(50))
    analysis.rankings.byFollowers.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${user.followers.toLocaleString()} подписчиков`)
    })
    
    console.log('\n⭐ РАНЖИРОВАНИЕ ПО РЕПУТАЦИИ')
    console.log('='.repeat(50))
    analysis.rankings.byReputation.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${Math.round(user.score)} баллов`)
    })
    
    console.log('\n🎯 РАНЖИРОВАНИЕ ПО КАЧЕСТВУ')
    console.log('='.repeat(50))
    analysis.rankings.byQuality.forEach((user, index) => {
      console.log(`${index + 1}. @${user.handle} - ${Math.round(user.qualityScore)} баллов`)
    })
    
    console.log('\n📋 ДЕТАЛЬНЫЙ АНАЛИЗ ПОЛЬЗОВАТЕЛЕЙ')
    console.log('='.repeat(50))
    
    analysis.users.forEach(user => {
      console.log(`\n👤 @${user.handle}`)
      console.log(`   Имя: ${user.basicInfo.name}`)
      console.log(`   Подписчики: ${user.basicInfo.followers.toLocaleString()}`)
      console.log(`   Подписки: ${user.basicInfo.following.toLocaleString()}`)
      console.log(`   Твиты: ${user.basicInfo.tweets.toLocaleString()}`)
      console.log(`   Верифицирован: ${user.basicInfo.verified ? '✅' : '❌'}`)
      console.log(`   Возраст аккаунта: ${user.basicInfo.accountAge} дней`)
      console.log(`   TweetScout рейтинг: ${user.reputation.tweetScoutScore}`)
      console.log(`   Репутация: ${Math.round(user.reputation.score)} баллов`)
      console.log(`   Качество: ${Math.round(user.reputation.qualityScore)} баллов`)
      
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

// Запускаем отчет
generateUserReport() 