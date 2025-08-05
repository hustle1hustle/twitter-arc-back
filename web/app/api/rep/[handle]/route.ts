import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { s3Client } from '@/lib/s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params
    
    // Remove @ if present
    const cleanHandle = handle.replace('@', '')
    
    // Check if we have cached reputation data
    const jsonKey = `arc/${cleanHandle}.json`
    
    try {
      // Try to get existing reputation data from S3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: jsonKey,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      
      // Fetch the data
      const response = await fetch(signedUrl)
      if (response.ok) {
        const repData = await response.json()
        return NextResponse.json(repData)
      }
    } catch (error) {
      console.log(`No existing reputation data for ${cleanHandle}, triggering generation`)
    }

    // If no existing data, trigger reputation generation
    await redis.lpush('jobs', JSON.stringify({ 
      tid: cleanHandle, 
      timestamp: Date.now(),
      source: 'api_request'
    }))

    // Return a placeholder response while generating
    return NextResponse.json({
      score: 0,
      qualityScore: 0,
      followerCount: 0,
      badges: [],
      description: `Generating reputation score for @${cleanHandle}...`,
      status: 'generating',
      handle: cleanHandle
    })

  } catch (error) {
    console.error('Reputation API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://twitter-arc-demo.vercel.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 