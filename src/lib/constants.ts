export const MUSIC_OPTIONS = {
  genre: {
    label: '장르',
    options: ['팝', '재즈', '클래식', '일렉트로닉', '앰비언트', 'R&B', '록', '어쿠스틱', '힙합', '보사노바'],
  },
  instrument: {
    label: '주요 악기',
    options: ['피아노', '기타', '바이올린', '첼로', '신스', '드럼', '플루트', '색소폰', '우쿨렐레'],
  },
  tempo: {
    label: '템포',
    options: ['아주 느리게', '느리게', '보통', '빠르게', '아주 빠르게'],
  },
  mood: {
    label: '분위기',
    options: ['평화로운', '우울한', '신나는', '몽환적', '따뜻한', '쓸쓸한', '밝은', '긴장되는'],
  },
  texture: {
    label: '질감/특징',
    options: ['미니멀', '레이어드', '오케스트라', '로파이', '어쿠스틱', '일렉트릭', '보컬 포함', '인스트루멘탈'],
  },
} as const;

export type MusicOptionGroup = keyof typeof MUSIC_OPTIONS;

export const DAILY_GENERATION_LIMIT = 3;
export const MUSIC_DURATION_SECONDS = 30;

export const STATUS_CONFIG = {
  pending: { color: '#ffbf00', label: '대기 중' },
  generating: { color: '#4fc3f7', label: '생성 중' },
  completed: { color: '#66bb6a', label: '생성 완료' },
  failed: { color: '#ef5350', label: '생성 실패' },
} as const;

export type GenerationStatus = keyof typeof STATUS_CONFIG;
