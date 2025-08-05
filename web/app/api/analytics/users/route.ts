import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const { handles } = await request.json()

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать массив handles пользователей' },
        { status: 400 }
      )
    }

    // Ограничиваем количество пользователей для анализа
    const limitedHandles = handles.slice(0, 10)

    const analysis = await analyticsService.analyzeMultipleUsers(limitedHandles)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Ошибка аналитики:', error)
    return NextResponse.json(
      { error: 'Ошибка при анализе пользователей' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')

    if (!handle) {
      return NextResponse.json(
        { error: 'Необходимо указать handle пользователя' },
        { status: 400 }
      )
    }

    const analysis = await analyticsService.analyzeUser(handle)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Ошибка аналитики:', error)
    return NextResponse.json(
      { error: 'Ошибка при анализе пользователя' },
      { status: 500 }
    )
  }
} 