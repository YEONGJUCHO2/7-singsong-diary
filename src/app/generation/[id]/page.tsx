'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGenerationStatus } from '@/hooks/use-generation-status'
import { WaveformAnimation } from '@/components/music/WaveformAnimation'
import { StatusDot } from '@/components/music/StatusDot'

export default function GenerationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { generation, loading } = useGenerationStatus(id)

  useEffect(() => {
    fetch(`/api/generate/${id}`, { method: 'POST' })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <WaveformAnimation />
      </div>
    )
  }

  if (!generation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-body text-on-surface-variant">생성 요청을 찾을 수 없어요.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-primary hover:underline">
          돌아가기
        </button>
      </div>
    )
  }

  const { status } = generation

  if (status === 'pending' || status === 'generating') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
        <WaveformAnimation />

        <div className="text-center space-y-3">
          <h1 className="text-headline text-primary-container">
            음악을 만들고 있어요...
          </h1>
          <StatusDot status={status} />
        </div>

        <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
          <p className="text-body text-on-surface italic">
            {generation.diary_entries.content}
          </p>
        </div>

        {generation.options && Object.keys(generation.options).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.values(generation.options).map((value) => (
              <span
                key={value as string}
                className="px-3 py-1 bg-surface-container-highest rounded-sm text-sm text-on-surface-variant"
              >
                {value as string}
              </span>
            ))}
          </div>
        )}

        <p className="text-label text-on-surface-variant uppercase">
          보통 20~30초 정도 걸려요
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-surface-container-highest text-primary rounded-xl hover:bg-surface-variant transition-colors"
        >
          생성 취소
        </button>
      </div>
    )
  }

  if (status === 'completed' && generation.audio_url && generation.title) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-on-surface-variant">결과 로딩 중...</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <StatusDot status="failed" />
          <h1 className="text-headline text-on-surface">
            음악 생성에 실패했어요
          </h1>
          {generation.error_message && (
            <p className="text-body text-on-surface-variant">{generation.error_message}</p>
          )}
        </div>

        <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
          <p className="text-body text-on-surface italic">
            {generation.diary_entries.content}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fetch(`/api/generate/${id}`, { method: 'POST' }).then(() => window.location.reload())}
            className="px-6 py-3 rounded-full font-extrabold text-on-primary-container"
            style={{ background: 'linear-gradient(135deg, #ffbf00, #e6a102)' }}
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-surface-container-highest text-primary rounded-xl hover:bg-surface-variant transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return null
}
