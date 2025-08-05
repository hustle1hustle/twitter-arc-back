import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const { tid } = await request.json()
    
    if (!tid) {
      return NextResponse.json({ error: 'Missing tid parameter' }, { status: 400 })
    }

    // Add job to Redis queue
    await redis.lpush('jobs', JSON.stringify({ tid, timestamp: Date.now() }))
    
    return NextResponse.json({ success: true, message: 'Job queued successfully' })
  } catch (error) {
    console.error('Trigger error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const worker = searchParams.get('worker')

  if (worker === 'pull') {
    try {
      // Pull job from queue (for cron job)
      const job = await redis.brpop('jobs', 1)
      
      if (job) {
        const jobData = JSON.parse(job[1])
        return NextResponse.json({ success: true, job: jobData })
      } else {
        return NextResponse.json({ success: true, message: 'No jobs available' })
      }
    } catch (error) {
      console.error('Worker pull error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid worker parameter' }, { status: 400 })
} 