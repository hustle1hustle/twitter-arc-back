import Redis from 'ioredis'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { TwitterApi } from 'twitter-api-v2'
import puppeteer from 'puppeteer'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { CardComponent } from './components/CardComponent'
import { TweetScoutAPI } from './tweetscout'
import { computeRep } from './rep'
import { SparkToroAPI, AudienseAPI, HypeAuditorAPI } from './out-of-crypto'

// Initialize clients
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!)
const tweetscout = new TweetScoutAPI(process.env.TWEETSCOUT_KEY!)

// Out-of-crypto circle APIs
const sparkToro = new SparkToroAPI(process.env.SPARKTORO_API_KEY || '')
const audiense = new AudienseAPI(process.env.AUDIENSE_API_KEY || '')
const hypeAuditor = new HypeAuditorAPI(process.env.HYPEAUDITOR_API_KEY || '')

interface Job {
  tid: string
  timestamp: number
}

async function fetchProfile(handle: string) {
  try {
    // Try TweetScout first
    const user = await tweetscout.getUser(handle)
    const smartFollowers = await tweetscout.getSmartFollowers(handle, 1)
    return { user, smartFollowers, source: 'tweetscout' }
  } catch (error) {
    console.log('TweetScout failed, falling back to Twitter API')
    
    // Fallback to Twitter API
    const user = await twitterClient.v2.userByUsername(handle, {
      'user.fields': ['id', 'username', 'name', 'public_metrics', 'verified', 'profile_image_url']
    })
    
    if (!user.data) {
      throw new Error('User not found')
    }
    
    // Mock smart followers data for Twitter API fallback
    const smartFollowers = {
      data: [],
      meta: { result_count: 0 }
    }
    
    return { user: user.data, smartFollowers, source: 'twitter' }
  }
}

async function fetchOutOfCryptoData(handle: string) {
  console.log(`Fetching out-of-crypto data for ${handle}`)
  
  // Fetch data from all out-of-crypto services in parallel
  const [sparkToroData, audienseData, hypeAuditorData] = await Promise.allSettled([
    sparkToro.getAudienceInterests(handle),
    audiense.getExpertLists(handle),
    hypeAuditor.getAudienceQuality(handle)
  ])

  return {
    sparkToroData: sparkToroData.status === 'fulfilled' ? sparkToroData.value : undefined,
    audienseData: audienseData.status === 'fulfilled' ? audienseData.value : undefined,
    hypeAuditorData: hypeAuditorData.status === 'fulfilled' ? hypeAuditorData.value : undefined
  }
}

async function generateCard(repData: any, user: any) {
  const html = renderToString(React.createElement(CardComponent, { repData, user }))
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 675 })
  await page.setContent(html)
  
  const screenshot = await page.screenshot({ type: 'png' })
  await browser.close()
  
  return screenshot
}

async function uploadToS3(key: string, data: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType,
  })
  
  await s3Client.send(command)
}

async function processJob(job: Job) {
  try {
    console.log(`Processing job for tid: ${job.tid}`)
    
    // Fetch profile data
    const { user, smartFollowers, source } = await fetchProfile(job.tid)
    
    // Fetch out-of-crypto circle data
    const outOfCryptoData = await fetchOutOfCryptoData(job.tid)
    
    // Compute reputation score with out-of-crypto data
    const repData = computeRep(
      user, 
      smartFollowers,
      outOfCryptoData.sparkToroData,
      outOfCryptoData.audienseData,
      outOfCryptoData.hypeAuditorData
    )
    
    // Generate card
    const cardBuffer = await generateCard(repData, user)
    
    // Upload to S3
    const pngKey = `arc/${job.tid}.png`
    const jsonKey = `arc/${job.tid}.json`
    
    await uploadToS3(pngKey, cardBuffer, 'image/png')
    await uploadToS3(jsonKey, Buffer.from(JSON.stringify(repData)), 'application/json')
    
    console.log(`Successfully processed job for ${job.tid}`)
    console.log(`Final REP score: ${repData.score}`)
    console.log(`Out-of-crypto bonuses: +${repData.nonCryptoBonus || 0} REP`)
  } catch (error) {
    console.error(`Error processing job for ${job.tid}:`, error)
  }
}

async function main() {
  console.log('Starting Twitter Arc worker with out-of-crypto circle analysis...')
  
  while (true) {
    try {
      // BLPOP job from queue
      const result = await redis.blpop('jobs', 1)
      
      if (result) {
        const job: Job = JSON.parse(result[1])
        await processJob(job)
      }
    } catch (error) {
      console.error('Worker error:', error)
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...')
  await redis.quit()
  process.exit(0)
})

main().catch(console.error) 