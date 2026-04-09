'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GenerationWithDiary } from '@/lib/types'

export function useGenerationStatus(generationId: string) {
  const [generation, setGeneration] = useState<GenerationWithDiary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchGeneration = async () => {
      const { data } = await supabase
        .from('music_generations')
        .select('*, diary_entries(*)')
        .eq('id', generationId)
        .single()

      if (data) setGeneration(data as GenerationWithDiary)
      setLoading(false)
    }

    fetchGeneration()

    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'music_generations',
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          setGeneration((prev) =>
            prev ? { ...prev, ...payload.new } as GenerationWithDiary : null
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId])

  return { generation, loading }
}
