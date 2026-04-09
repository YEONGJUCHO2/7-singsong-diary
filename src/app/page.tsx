import { createClient } from '@/lib/supabase/server'
import { DiaryForm } from '@/components/diary/DiaryForm'

interface Props {
  searchParams: Promise<{ diary?: string }>
}

export default async function MainPage({ searchParams }: Props) {
  const { diary: diaryId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('music_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', today.toISOString())

  let initialContent = ''
  if (diaryId) {
    const { data: entry } = await supabase
      .from('diary_entries')
      .select('content')
      .eq('id', diaryId)
      .single()
    initialContent = entry?.content ?? ''
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DiaryForm todayCount={count ?? 0} initialContent={initialContent} />
    </div>
  )
}
