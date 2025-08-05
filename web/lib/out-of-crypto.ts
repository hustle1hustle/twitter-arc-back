import fetch from 'node-fetch'

// SparkToro API Client
export class SparkToroAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getAudienceInterests(handle: string): Promise<{ interests: string[], topPublications: string[] }> {
    try {
      const response = await fetch(`https://api.sparktoro.com/v1/audience/${handle}/interests`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SparkToro API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        interests: data.interests?.slice(0, 10) || [],
        topPublications: data.publications?.slice(0, 5) || []
      }
    } catch (error) {
      console.warn('SparkToro API failed:', error)
      return { interests: [], topPublications: [] }
    }
  }
}

// Audiense API Client
export class AudienseAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getExpertLists(handle: string): Promise<{ expertLists: number, listMemberships: string[] }> {
    try {
      const response = await fetch(`https://api.audiense.com/v1/user/${handle}/lists`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Audiense API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        expertLists: data.expert_lists?.length || 0,
        listMemberships: data.list_memberships || []
      }
    } catch (error) {
      console.warn('Audiense API failed:', error)
      return { expertLists: 0, listMemberships: [] }
    }
  }
}

// HypeAuditor API Client
export class HypeAuditorAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getAudienceQuality(handle: string): Promise<{ fakeRatio: number, audienceQuality: number, botPercentage: number }> {
    try {
      const response = await fetch(`https://api.hypeauditor.com/v1/user/${handle}/audience-quality`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HypeAuditor API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        fakeRatio: data.fake_ratio || 0,
        audienceQuality: data.audience_quality || 0,
        botPercentage: data.bot_percentage || 0
      }
    } catch (error) {
      console.warn('HypeAuditor API failed:', error)
      return { fakeRatio: 0, audienceQuality: 0, botPercentage: 0 }
    }
  }
}

// Initialize API clients
export const sparkToro = new SparkToroAPI(process.env.SPARKTORO_API_KEY || '')
export const audiense = new AudienseAPI(process.env.AUDIENSE_API_KEY || '')
export const hypeAuditor = new HypeAuditorAPI(process.env.HYPEAUDITOR_API_KEY || '') 