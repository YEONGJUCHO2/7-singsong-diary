import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMusic } from '@/lib/music-api'
import { canGenerate } from '@/lib/daily-limit'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: generation } = await supabase
    .from('music_generations')
    .select('*, diary_entries(content)')
    .eq('id', id)
    .single()

  if (!generation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (generation.status !== 'pending') {
    return NextResponse.json({ status: generation.status })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('music_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
    .neq('id', id)

  if (!canGenerate(count ?? 0)) {
    await serviceSupabase
      .from('music_generations')
      .update({ status: 'failed', error_message: '일일 생성 제한을 초과했습니다.' })
      .eq('id', id)
    return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 429 })
  }

  await serviceSupabase
    .from('music_generations')
    .update({ status: 'generating' })
    .eq('id', id)

  try {
    const diaryContent = (generation.diary_entries as { content: string }).content
    const result = await generateMusic({
      prompt: diaryContent,
      ...generation.options,
    })

    await serviceSupabase
      .from('music_generations')
      .update({
        status: 'completed',
        audio_url: result.audioUrl,
        title: result.title,
        duration_seconds: result.durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ status: 'completed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await serviceSupabase
      .from('music_generations')
      .update({ status: 'failed', error_message: message })
      .eq('id', id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
