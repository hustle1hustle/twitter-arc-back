import fetch from 'node-fetch'

const TWEETSCOUT_BASE_URL = 'https://api.tweetscout.io/v2'

export interface TweetScoutUser {
  id: string
  username: string
  name: string
  followers_count: number
  following_count: number
  tweet_count: number
  verified: boolean
  profile_image_url: string
}

export interface TweetScoutSmartFollowers {
  data: Array<{
    id: string
    username: string
    followers_count: number
    verified: boolean
  }>
  meta: {
    result_count: number
    next_token?: string
  }
}

export class TweetScoutAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getUser(handle: string): Promise<TweetScoutUser> {
    const response = await fetch(`${TWEETSCOUT_BASE_URL}/user/${handle}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TweetScout API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getSmartFollowers(handle: string, page = 1): Promise<TweetScoutSmartFollowers> {
    const response = await fetch(`${TWEETSCOUT_BASE_URL}/user/${handle}/smartFollowers?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TweetScout API error: ${response.statusText}`)
    }

    return response.json()
  }
}

export const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY!) 