import { NextRequest, NextResponse } from 'next/server'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { tid: string } }
) {
  try {
    const { tid } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'png'

    if (!['png', 'json'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    const key = `arc/${tid}.${type}`
    
    // Generate signed URL for S3 object
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({ 
      success: true, 
      url: signedUrl,
      key,
      type 
    })
  } catch (error) {
    console.error('Card URL generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 