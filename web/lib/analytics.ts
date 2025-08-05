import { TweetScoutAPI, TweetScoutUser, TweetScoutSmartFollowers } from './tweetscout'
import { computeRep, ReputationScore } from './rep'

export interface UserAnalytics {
  handle: string
  basicInfo: {
    name: string
    followers: number
    following: number
    tweets: number
    verified: boolean
    profileImage: string
  }
  reputation: ReputationScore
  audienceAnalysis: {
    verifiedFollowers: number
    totalFollowers: number
    verifiedRatio: number
    topFollowers: Array<{
      username: string
      followers: number
      verified: boolean
    }>
  }
  engagementMetrics: {
    followerToFollowingRatio: number
    tweetToFollowerRatio: number
    accountAge: number // в днях
  }
  comparativeRanking: {
    followerRank: number
    reputationRank: number
    qualityRank: number
  }
  insights: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
}

export interface ComparativeAnalysis {
  users: UserAnalytics[]
  summary: {
    totalUsers: number
    averageFollowers: number
    averageReputation: number
    topPerformer: string
    mostEngaged: string
    highestQuality: string
  }
  rankings: {
    byFollowers: Array<{ handle: string; followers: number }>
    byReputation: Array<{ handle: string; score: number }>
    byQuality: Array<{ handle: string; qualityScore: number }>
  }
}

export class UserAnalyticsService {
  private tweetscout: TweetScoutAPI

  constructor(tweetscout: TweetScoutAPI) {
    this.tweetscout = tweetscout
  }

  async analyzeUser(handle: string): Promise<UserAnalytics> {
    try {
      // Получаем данные пользователя
      const user = await this.tweetscout.getUser(handle)
      const smartFollowers = await this.tweetscout.getSmartFollowers(handle)

      // Вычисляем репутацию
      const reputation = computeRep(user, smartFollowers)

      // Анализируем аудиторию
      const verifiedFollowers = smartFollowers.data.filter(f => f.verified).length
      const totalFollowers = smartFollowers.data.length
      const verifiedRatio = totalFollowers > 0 ? verifiedFollowers / totalFollowers : 0

      // Топ подписчики (первые 10)
      const topFollowers = smartFollowers.data
        .sort((a, b) => b.followers_count - a.followers_count)
        .slice(0, 10)
        .map(f => ({
          username: f.username,
          followers: f.followers_count,
          verified: f.verified
        }))

      // Метрики вовлеченности
      const followerToFollowingRatio = user.following_count > 0 ? user.followers_count / user.following_count : 0
      const tweetToFollowerRatio = user.followers_count > 0 ? user.tweet_count / user.followers_count : 0

      // Анализ сильных и слабых сторон
      const strengths: string[] = []
      const weaknesses: string[] = []
      const recommendations: string[] = []

      if (user.verified) strengths.push('Верифицированный аккаунт')
      if (verifiedRatio > 0.3) strengths.push('Высокое качество аудитории')
      if (followerToFollowingRatio > 2) strengths.push('Хорошее соотношение подписчиков/подписок')
      if ((reputation.nonCryptoBonus || 0) > 0) strengths.push('Выходит за рамки крипто-сообщества')

      if (verifiedRatio < 0.1) {
        weaknesses.push('Низкое качество аудитории')
        recommendations.push('Работать над привлечением качественных подписчиков')
      }
      if (followerToFollowingRatio < 0.5) {
        weaknesses.push('Много подписок при малом количестве подписчиков')
        recommendations.push('Сфокусироваться на создании качественного контента')
      }
      if (user.tweet_count < 100) {
        weaknesses.push('Мало твитов')
        recommendations.push('Увеличить активность в Twitter')
      }

      return {
        handle,
        basicInfo: {
          name: user.name,
          followers: user.followers_count,
          following: user.following_count,
          tweets: user.tweet_count,
          verified: user.verified,
          profileImage: user.profile_image_url
        },
        reputation,
        audienceAnalysis: {
          verifiedFollowers,
          totalFollowers,
          verifiedRatio,
          topFollowers
        },
        engagementMetrics: {
          followerToFollowingRatio,
          tweetToFollowerRatio,
          accountAge: 0 // TODO: добавить расчет возраста аккаунта
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
      throw new Error(`Ошибка анализа пользователя ${handle}: ${error}`)
    }
  }

  async analyzeMultipleUsers(handles: string[]): Promise<ComparativeAnalysis> {
    const users = await Promise.all(
      handles.map(handle => this.analyzeUser(handle))
    )

    // Сортируем по разным метрикам
    const byFollowers = users
      .map(u => ({ handle: u.handle, followers: u.basicInfo.followers }))
      .sort((a, b) => b.followers - a.followers)

    const byReputation = users
      .map(u => ({ handle: u.handle, score: u.reputation.score }))
      .sort((a, b) => b.score - a.score)

    const byQuality = users
      .map(u => ({ handle: u.handle, qualityScore: u.reputation.qualityScore }))
      .sort((a, b) => b.qualityScore - a.qualityScore)

    // Обновляем ранги
    users.forEach(user => {
      user.comparativeRanking.followerRank = byFollowers.findIndex(u => u.handle === user.handle) + 1
      user.comparativeRanking.reputationRank = byReputation.findIndex(u => u.handle === user.handle) + 1
      user.comparativeRanking.qualityRank = byQuality.findIndex(u => u.handle === user.handle) + 1
    })

    // Вычисляем средние значения
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

// Создаем экземпляр сервиса
export const analyticsService = new UserAnalyticsService(
  new TweetScoutAPI(process.env.TWEETSCOUT_KEY!)
) 