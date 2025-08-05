import { TweetScoutUser, TweetScoutSmartFollowers } from './tweetscout'

export interface ReputationScore {
  score: number
  qualityScore: number
  followerCount: number
  verifiedFollowers: number
  totalFollowers: number
  badges: string[]
  description: string
  // Out-of-crypto circle additions
  audienceInterests?: string[]
  expertLists?: number
  fakeRatio?: number
  nonCryptoBonus?: number
  topSegments?: string[]
}

// Top 7 out-of-crypto segments (Pareto 80/20)
const TOP_SEGMENTS = [
  'Creators / Solo-preneurs',
  'AI / Tech Innovators', 
  'Gaming & Esports',
  'FinTwit (equities, macro)',
  'Product / UX Design',
  'Media / Journalists',
  'Sports Fans'
]

// Non-crypto keywords for bio analysis
const NON_CRYPTO_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'ml',
  'tech', 'technology', 'innovation', 'startup', 'founder',
  'creator', 'content', 'design', 'ux', 'product',
  'gaming', 'esports', 'finance', 'trading', 'equities',
  'media', 'journalism', 'sports', 'fitness', 'health'
]

interface SparkToroData {
  interests: string[]
  topPublications: string[]
}

interface AudienseData {
  expertLists: number
  listMemberships: string[]
}

interface HypeAuditorData {
  fakeRatio: number
  audienceQuality: number
  botPercentage: number
}

export function computeRep(
  user: TweetScoutUser,
  smartFollowers: TweetScoutSmartFollowers,
  // Out-of-crypto circle data
  sparkToroData?: SparkToroData,
  audienseData?: AudienseData,
  hypeAuditorData?: HypeAuditorData
): ReputationScore {
  const followerCount = user.followers_count
  const verifiedFollowers = smartFollowers.data.filter(f => f.verified).length
  const totalFollowers = smartFollowers.data.length

  // Base score from follower count (logarithmic scale)
  let baseScore = Math.log10(followerCount + 1) * 100

  // Quality multiplier based on verified followers ratio
  const verifiedRatio = totalFollowers > 0 ? verifiedFollowers / totalFollowers : 0
  const qualityMultiplier = 0.5 + (verifiedRatio * 0.5) // 0.5 to 1.0

  // Blue check bonus
  const blueCheckBonus = user.verified ? 50 : 0

  // Engagement bonus (simplified)
  const engagementBonus = Math.min(followerCount / 1000, 100)

  // OUT-OF-CRYPTO CIRCLE BONUSES

  // 1. Non-crypto bio bonus (+6 REP if contains AI/tech keywords)
  let nonCryptoBonus = 0
  const userBio = (user.name + ' ' + (user as any).description || '').toLowerCase()
  const hasNonCryptoKeywords = NON_CRYPTO_KEYWORDS.some(keyword => 
    userBio.includes(keyword)
  )
  if (hasNonCryptoKeywords) {
    nonCryptoBonus = 6
  }

  // 2. SparkToro audience interests bonus
  let interestsBonus = 0
  if (sparkToroData?.interests) {
    const relevantInterests = sparkToroData.interests.filter(interest =>
      TOP_SEGMENTS.some(segment => 
        interest.toLowerCase().includes(segment.toLowerCase().split(' ')[0])
      )
    )
    interestsBonus = relevantInterests.length * 3 // +3 REP per relevant interest
  }

  // 3. Audiense expert lists bonus
  let expertListsBonus = 0
  if (audienseData?.expertLists) {
    expertListsBonus = audienseData.expertLists * 5 // +5 REP per expert list
  }

  // 4. HypeAuditor fake ratio penalty/bonus
  let fakeRatioBonus = 0
  if (hypeAuditorData?.audienceQuality) {
    const quality = hypeAuditorData.audienceQuality
    if (quality >= 90) fakeRatioBonus = 10
    else if (quality >= 80) fakeRatioBonus = 5
    else if (quality < 70) fakeRatioBonus = -10 // Penalty for low quality
  }

  // Calculate final score with out-of-crypto bonuses
  const finalScore = Math.round(
    (baseScore * qualityMultiplier) + 
    blueCheckBonus + 
    engagementBonus + 
    nonCryptoBonus + 
    interestsBonus + 
    expertListsBonus + 
    fakeRatioBonus
  )

  // Quality score percentage
  const qualityScore = Math.round(verifiedRatio * 100)

  // Determine badges
  const badges: string[] = []
  if (user.verified) badges.push('Verified')
  if (verifiedRatio > 0.3) badges.push('High Quality')
  if (followerCount > 10000) badges.push('Influencer')
  if (verifiedRatio > 0.5) badges.push('Elite')
  
  // Out-of-crypto badges
  if (nonCryptoBonus > 0) badges.push('Non-Crypto')
  if (interestsBonus > 0) badges.push('Diverse Audience')
  if (expertListsBonus > 0) badges.push('Expert Network')
  if (fakeRatioBonus >= 10) badges.push('High Quality Audience')

  // Generate description
  let description = `This profile has ${followerCount.toLocaleString()} followers`
  if (verifiedRatio > 0.3) {
    description += ` with a high quality follower base (${qualityScore}% verified followers).`
  } else {
    description += ` with a standard follower distribution.`
  }
  
  if (user.verified) {
    description += ' The account is verified, indicating authenticity.'
  }

  // Add out-of-crypto insights
  if (sparkToroData?.interests?.length) {
    description += ` Audience interests include: ${sparkToroData.interests.slice(0, 3).join(', ')}.`
  }
  
  if (audienseData?.expertLists) {
    description += ` Member of ${audienseData.expertLists} expert lists.`
  }

  if (hypeAuditorData?.audienceQuality) {
    description += ` Audience quality: ${hypeAuditorData.audienceQuality}%.`
  }

  return {
    score: finalScore,
    qualityScore,
    followerCount,
    verifiedFollowers,
    totalFollowers,
    badges,
    description,
    // Out-of-crypto data
    audienceInterests: sparkToroData?.interests,
    expertLists: audienseData?.expertLists,
    fakeRatio: hypeAuditorData?.fakeRatio,
    nonCryptoBonus,
    topSegments: TOP_SEGMENTS
  }
} 