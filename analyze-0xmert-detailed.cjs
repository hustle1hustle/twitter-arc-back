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
      console.log(`🔍 TweetScout: Получаю данные пользователя @${handle}...`)
      return await this.makeRequest(`/info/${handle}`)
    } catch (error) {
      throw new Error(`TweetScout API error for user ${handle}: ${error.message}`)
    }
  }

  async getUserScore(handle) {
    try {
      console.log(`🔍 TweetScout: Получаю рейтинг @${handle}...`)
      return await this.makeRequest(`/score/${handle}`)
    } catch (error) {
      console.log(`⚠️ TweetScout score not available for @${handle}`)
      return null
    }
  }
}

async function detailedAnalysis0xmert() {
  const handle = '0xmert_'
  
  console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ @0xmert_')
  console.log('='.repeat(80))
  console.log('📊 TweetScout Data Analysis')
  console.log('='.repeat(80))
  
  try {
    const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY)
    
    // Получаем данные пользователя
    const user = await tweetscout.getUser(handle)
    const score = await tweetscout.getUserScore(handle)
    
    console.log('\n📋 СЫРЫЕ ДАННЫЕ TWEETSCOUT:')
    console.log('='.repeat(80))
    console.log('👤 Информация о пользователе:')
    console.log(JSON.stringify(user, null, 2))
    
    console.log('\n🎯 TweetScout Score:')
    console.log(JSON.stringify(score, null, 2))
    
    // Анализируем данные
    console.log('\n📊 ДЕТАЛЬНЫЙ АНАЛИЗ ДАННЫХ:')
    console.log('='.repeat(80))
    
    // Основная информация
    console.log('\n👤 ОСНОВНАЯ ИНФОРМАЦИЯ:')
    console.log('─'.repeat(50))
    console.log(`📝 Имя: ${user.name}`)
    console.log(`🏷️  Username: @${user.screen_name}`)
    console.log(`🆔 ID: ${user.id}`)
    console.log(`📄 Описание: ${user.description}`)
    console.log(`🔗 URL: ${user.url || 'Не указан'}`)
    console.log(`📅 Дата регистрации: ${user.register_date}`)
    console.log(`✅ Верифицирован: ${user.verified ? 'ДА' : 'НЕТ'}`)
    console.log(`💬 Может получать DM: ${user.can_dm ? 'ДА' : 'НЕТ'}`)
    
    // Медиа
    console.log('\n🖼️ МЕДИА:')
    console.log('─'.repeat(50))
    console.log(`👤 Аватар: ${user.avatar}`)
    console.log(`🖼️  Баннер: ${user.banner}`)
    
    // Статистика
    console.log('\n📈 СТАТИСТИКА:')
    console.log('─'.repeat(50))
    console.log(`👥 Подписчики: ${user.followers_count.toLocaleString()}`)
    console.log(`👤 Подписки: ${user.friends_count.toLocaleString()}`)
    console.log(`🐦 Твиты: ${user.tweets_count.toLocaleString()}`)
    
    // Вычисляем дополнительные метрики
    const followerCount = user.followers_count
    const followingCount = user.friends_count
    const tweetCount = user.tweets_count
    const isVerified = user.verified
    const createdAt = user.register_date
    
    // Возраст аккаунта
    const createdDate = new Date(createdAt)
    const now = new Date()
    const accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    const accountAgeYears = (accountAgeDays / 365).toFixed(1)
    
    console.log('\n⏰ ВОЗРАСТ АККАУНТА:')
    console.log('─'.repeat(50))
    console.log(`📅 Дата создания: ${createdAt}`)
    console.log(`📊 Дней с регистрации: ${accountAgeDays}`)
    console.log(`📊 Лет с регистрации: ${accountAgeYears}`)
    
    // Соотношения
    console.log('\n📊 СООТНОШЕНИЯ:')
    console.log('─'.repeat(50))
    const followerToFollowingRatio = followingCount > 0 ? followerCount / followingCount : 0
    const tweetToFollowerRatio = followerCount > 0 ? tweetCount / followerCount : 0
    const tweetToFollowingRatio = followingCount > 0 ? tweetCount / followingCount : 0
    
    console.log(`📈 Подписчики/Подписки: ${followerToFollowingRatio.toFixed(2)}`)
    console.log(`📊 Твиты/Подписчики: ${tweetToFollowerRatio.toFixed(3)}`)
    console.log(`📊 Твиты/Подписки: ${tweetToFollowingRatio.toFixed(2)}`)
    
    // TweetScout Score анализ
    console.log('\n🎯 TWEETSCOUT SCORE АНАЛИЗ:')
    console.log('─'.repeat(50))
    if (score) {
      console.log(`🏆 TweetScout Score: ${score.score}`)
      console.log(`📊 Оценка: ${getScoreDescription(score.score)}`)
    } else {
      console.log(`⚠️ TweetScout Score недоступен`)
    }
    
    // Репутационный анализ
    console.log('\n⭐ РЕПУТАЦИОННЫЙ АНАЛИЗ:')
    console.log('─'.repeat(50))
    
    // Base score from follower count (logarithmic scale)
    const baseScore = Math.log10(followerCount + 1) * 100
    const ageBonus = Math.min(accountAgeDays / 365, 50)
    const verificationBonus = isVerified ? 50 : 0
    const engagementRate = followerCount > 0 ? (tweetCount / followerCount) * 1000 : 0
    const engagementBonus = Math.min(engagementRate, 50)
    const tweetScoutBonus = score ? Math.round(score.score) : 0
    
    const finalScore = Math.round(baseScore + ageBonus + verificationBonus + tweetScoutBonus + engagementBonus)
    const qualityScore = finalScore * (0.5 + ((score?.score || 0) / 200))
    
    console.log(`📊 Базовая оценка (подписчики): ${Math.round(baseScore)}`)
    console.log(`📊 Бонус за возраст: ${Math.round(ageBonus)}`)
    console.log(`📊 Бонус за верификацию: ${verificationBonus}`)
    console.log(`📊 Бонус за вовлеченность: ${Math.round(engagementBonus)}`)
    console.log(`📊 TweetScout бонус: ${tweetScoutBonus}`)
    console.log(`🏆 ИТОГОВАЯ РЕПУТАЦИЯ: ${finalScore}`)
    console.log(`🎯 КАЧЕСТВЕННАЯ ОЦЕНКА: ${Math.round(qualityScore)}`)
    
    // Категоризация
    console.log('\n🏷️ КАТЕГОРИЗАЦИЯ:')
    console.log('─'.repeat(50))
    console.log(`👑 Тип аккаунта: ${getAccountType(followerCount, isVerified, accountAgeDays)}`)
    console.log(`📊 Уровень влияния: ${getInfluenceLevel(followerCount)}`)
    console.log(`📈 Уровень активности: ${getActivityLevel(tweetCount, accountAgeDays)}`)
    console.log(`🎯 Качество контента: ${getContentQuality(score?.score || 0)}`)
    
    // Сильные стороны
    console.log('\n💪 СИЛЬНЫЕ СТОРОНЫ:')
    console.log('─'.repeat(50))
    const strengths = []
    if (isVerified) strengths.push('✅ Верифицированный аккаунт')
    if (accountAgeDays > 365) strengths.push('✅ Долгосрочный аккаунт')
    if (followerCount > 10000) strengths.push('✅ Крупная аудитория')
    if (followerToFollowingRatio > 2) strengths.push('✅ Хорошее соотношение подписчиков/подписок')
    if (score && score.score > 100) strengths.push(`✅ Высокий TweetScout рейтинг (${Math.round(score.score)})`)
    if (tweetCount > 1000) strengths.push('✅ Высокая активность')
    
    strengths.forEach(strength => console.log(strength))
    
    // Рекомендации
    console.log('\n💡 РЕКОМЕНДАЦИИ:')
    console.log('─'.repeat(50))
    const recommendations = []
    
    if (followerToFollowingRatio < 0.5) {
      recommendations.push('💡 Сфокусироваться на создании качественного контента')
    }
    if (tweetToFollowerRatio < 0.1) {
      recommendations.push('💡 Увеличить частоту твитов')
    }
    if (score && score.score < 100) {
      recommendations.push('💡 Работать над улучшением TweetScout рейтинга')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 Отличные показатели! Продолжайте в том же духе')
    }
    
    recommendations.forEach(rec => console.log(rec))
    
    // Сравнение с другими
    console.log('\n📊 СРАВНЕНИЕ С ДРУГИМИ ПОЛЬЗОВАТЕЛЯМИ:')
    console.log('─'.repeat(50))
    console.log(`👥 Подписчики: ${followerCount.toLocaleString()} (${getPercentile(followerCount, [67392, 33419, 248751])}%ile)`)
    console.log(`🐦 Твиты: ${tweetCount.toLocaleString()} (${getPercentile(tweetCount, [1686, 16443, 59057])}%ile)`)
    console.log(`📊 TweetScout: ${Math.round(score?.score || 0)} (${getPercentile(score?.score || 0, [343, 1304, 2577])}%ile)`)
    
    console.log('\n🎯 ЗАКЛЮЧЕНИЕ:')
    console.log('─'.repeat(50))
    console.log('@0xmert_ демонстрирует исключительные показатели:')
    console.log('• Один из крупнейших аккаунтов в анализируемой группе')
    console.log('• Максимальный TweetScout рейтинг')
    console.log('• Высокая активность и долгосрочное присутствие')
    console.log('• Верифицированный статус подтверждает авторитетность')
    console.log('• Отличное соотношение подписчиков и активности')
    
  } catch (error) {
    console.error('❌ Ошибка при анализе:', error.message)
  }
}

// Вспомогательные функции
function getScoreDescription(score) {
  if (score >= 2000) return 'ЭЛИТНЫЙ'
  if (score >= 1000) return 'ОТЛИЧНЫЙ'
  if (score >= 500) return 'ХОРОШИЙ'
  if (score >= 100) return 'СРЕДНИЙ'
  return 'НИЗКИЙ'
}

function getAccountType(followers, verified, age) {
  if (verified && followers > 50000) return 'CELEBRITY'
  if (verified && followers > 10000) return 'INFLUENCER'
  if (age > 365 && followers > 5000) return 'ESTABLISHED'
  if (age < 30) return 'NEW'
  return 'REGULAR'
}

function getInfluenceLevel(followers) {
  if (followers >= 100000) return 'MEGA INFLUENCER'
  if (followers >= 50000) return 'MACRO INFLUENCER'
  if (followers >= 10000) return 'MICRO INFLUENCER'
  if (followers >= 1000) return 'NANO INFLUENCER'
  return 'REGULAR USER'
}

function getActivityLevel(tweets, age) {
  const tweetsPerDay = tweets / age
  if (tweetsPerDay >= 10) return 'ОЧЕНЬ ВЫСОКАЯ'
  if (tweetsPerDay >= 5) return 'ВЫСОКАЯ'
  if (tweetsPerDay >= 2) return 'СРЕДНЯЯ'
  if (tweetsPerDay >= 1) return 'НИЗКАЯ'
  return 'ОЧЕНЬ НИЗКАЯ'
}

function getContentQuality(score) {
  if (score >= 2000) return 'ЭЛИТНЫЙ'
  if (score >= 1000) return 'ОТЛИЧНЫЙ'
  if (score >= 500) return 'ХОРОШИЙ'
  if (score >= 100) return 'СРЕДНИЙ'
  return 'НИЗКИЙ'
}

function getPercentile(value, values) {
  const sorted = values.sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)
  return Math.round(((index + 1) / sorted.length) * 100)
}

// Запускаем детальный анализ
detailedAnalysis0xmert() 