import { createClient } from '@/lib/supabase/server'
import { HistoryList } from './history-list'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('music_generations')
    .select('*, diary_entries(*)')
    .eq('user_id', user!.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-display text-primary mb-8">지난 기록</h1>
      <HistoryList generations={generations ?? []} />
    </div>
  )
}
