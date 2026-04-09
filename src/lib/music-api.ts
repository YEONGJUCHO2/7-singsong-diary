export interface MusicGenerationRequest {
  prompt: string
  genre?: string
  instrument?: string
  tempo?: string
  mood?: string
  texture?: string
}

export interface MusicGenerationResult {
  audioUrl: string
  title: string
  durationSeconds: number
}

const IS_MOCK = process.env.MOCK_MUSIC_API === 'true'

export async function generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  if (IS_MOCK) {
    return mockGenerate(request)
  }
  return sunoGenerate(request)
}

async function mockGenerate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mood = request.mood ?? '잔잔한'
  const genre = request.genre ?? '팝'
  const title = `${mood} ${genre} — ${request.prompt.slice(0, 20)}...`

  return {
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title,
    durationSeconds: 30,
  }
}

async function sunoGenerate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  const apiKey = process.env.SUNO_API_KEY
  const apiUrl = process.env.SUNO_API_URL ?? 'https://api.suno.ai'

  if (!apiKey) throw new Error('SUNO_API_KEY is not set')

  const tags = [request.genre, request.instrument, request.tempo, request.mood, request.texture]
    .filter(Boolean)
    .join(', ')

  const prompt = `${request.prompt}\n\nStyle: ${tags || 'AI choice'}`

  const createRes = await fetch(`${apiUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      make_instrumental: !request.texture?.includes('보컬'),
      wait_audio: true,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Suno API error: ${createRes.status} ${await createRes.text()}`)
  }

  const data = await createRes.json()
  const clip = Array.isArray(data) ? data[0] : data

  return {
    audioUrl: clip.audio_url,
    title: clip.title ?? '무제',
    durationSeconds: 30,
  }
}
