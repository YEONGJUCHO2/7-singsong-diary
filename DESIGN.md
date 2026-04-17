# SingSong Diary Design System

## Concept

음악 일기앱. 일기를 쓰면 AI가 30초 음악을 만들어주는 경험.
"Resonant Monolith" — 하이엔드 레코딩 스튜디오의 깊은 어둠 속에서 앰버/골드 빛이 리듬처럼 빛나는 느낌.
앱은 유틸리티가 아니라 악기처럼 느껴져야 한다.

## Color

앰버/골드 모노크롬 + 차콜 블랙. Material Design 토큰 기반.

### Core Palette
- **Primary:** #ffe2ab (소프트 골드 — 텍스트/하이라이트)
- **Primary Container:** #ffbf00 (히어로 앰버 — CTA, 액센트)
- **Secondary:** #ffbe4a
- **Secondary Container:** #e6a102
- **Tertiary:** #ffe396
- **Tertiary Container:** #eec540
- **Background / Surface:** #131313 (스튜디오 블랙)
- **On-Primary:** #402d00 (앰버 위 다크 텍스트)
- **On-Primary Container:** #6d5000
- **On-Surface:** #e5e2e1

### Surface Tiers (Tonal Layering)
보더 대신 배경색 단차로 영역을 구분한다.
- **Surface Container Lowest:** #0e0e0e
- **Surface Container Low:** #1c1b1b
- **Surface Container:** #201f1f
- **Surface Container High:** #2a2a2a
- **Surface Container Highest:** #353534
- **Surface Variant:** #353534
- **Outline Variant:** #504532 (15% 투명도로 사용)

### 상태 표시 (CSS 도트 8px 원 + 텍스트, 이모지 아님)
- 앰버 도트 (#ffbf00) = 대기 중 (pending)
- 파랑 도트 (#4fc3f7) = 생성 중 (generating)
- 초록 도트 (#66bb6a) = 생성 완료 (completed)
- 빨강 도트 (#ef5350) = 생성 실패 (failed)

### 컬러 규칙
- **No-Line Rule:** 1px 보더로 영역 구분 금지. Tonal Shift만 사용.
- **Glass & Gradient:** 네비게이션 바, 플로팅 컨트롤에 글래스모피즘 적용 (surface-container 70% 투명도 + 20px backdrop-blur).
- **Ambient Shadow:** 그림자는 검정이 아닌 앰버 틴트 사용 (`rgba(255, 191, 0, 0.06)`).
- Primary Container는 스포트라이트처럼 아껴서 사용.

## Typography

- **Font:** Manrope (모든 용도 — headline, body, label)
- **Display:** 3.5rem, tracking -2%, extrabold — 날짜/임팩트 헤더용
- **Headline:** 1.75rem, bold — 섹션 헤더
- **Body:** 0.875rem, line-height 1.6 — 일기 본문
- **Label:** 0.75rem, uppercase, letter-spacing 5% — 메타데이터 (BPM, 상태 등)
- **Roundness:** 0.75rem (xl) 기본. 칩/태그는 lg (0.5rem). Rhythm Tag는 sm (0.125rem, 거의 각진 피아노 키 모양).

## Principles

- 이모지 절대 금지. Material Symbols (Outlined) 아이콘과 CSS 컬러 도트만 사용.
- 다크 모드 기본. 차콜 블랙 + 앰버/골드.
- 음악적 시각 언어: 웨이브폼, 사운드 바, 리듬 패턴.
- **한국어 UI (모든 라벨, 버튼, 네비게이션, 옵션 칩 한국어).** 영어 사용 금지.
- 에디토리얼 타이포: 날짜/제목에 과감한 사이즈 대비.
- 로딩은 스피너 대신 앰버 웨이브폼 애니메이션.
- 화면당 하나의 주요 액션에 집중.
- 요소 간 겹침(overlap) 허용으로 깊이감 부여.

## Components

### Option Chips
- 5개 그룹, 각 그룹에서 단일 선택 (미선택 시 제출 가능 — AI가 일기 기반 판단)
- 미선택: surface-variant 배경, on-surface-variant 텍스트
- 선택: primary-container 배경, on-primary-container 텍스트, font-semibold
- 그룹별 선택지 (전부 한국어):
  - **장르:** 팝, 재즈, 클래식, 일렉트로닉, 앰비언트, R&B, 록, 어쿠스틱, 힙합, 보사노바
  - **주요 악기:** 피아노, 기타, 바이올린, 첼로, 신스, 드럼, 플루트, 색소폰, 우쿨렐레
  - **템포:** 아주 느리게, 느리게, 보통, 빠르게, 아주 빠르게
  - **분위기:** 평화로운, 우울한, 신나는, 몽환적, 따뜻한, 쓸쓸한, 밝은, 긴장되는
  - **질감/특징:** 미니멀, 레이어드, 오케스트라, 로파이, 어쿠스틱, 일렉트릭, 보컬 포함, 인스트루멘탈

### Music Player
- 웨이브폼 시각화 (앰버 그래디언트, 재생 진행 부분은 primary-container + glow, 미재생 부분은 surface-container-highest)
- 원형 재생/일시정지 버튼 (primary-container 배경, 앰버 ambient shadow)
- 시간 표시: "0:00 / 0:30" (30초 고정)
- 다운로드 버튼 (아이콘만, 우측)
- skip 버튼 없음 (단일 트랙)

### Cards
- Tonal Layering으로 구분 (보더 대신 surface-container 단차)
- 다이어리 카드: 좌측 4px primary-container 보더 액센트 + surface-container-low 배경
- 히스토리 카드: 카드별 배경 밝기 변화로 시각적 리듬감 (asymmetric rhythm)

### Status Indicator
- CSS 컬러 도트 (8px 원) + 한국어 텍스트
- "음악을 만들고 있어요..." + 파랑 도트 (generating)
- "생성 완료" + 초록 도트 (completed)
- "생성 실패 — 다시 시도해보세요" + 빨강 도트 (failed)

### Buttons
- **Primary:** primary-container 배경, 앰버→골드 그래디언트, rounded-full, extrabold
- **Secondary:** surface-container-highest 배경, primary 텍스트, 호버 시 밝아짐
- **Danger / Cancel:** error 텍스트 + surface-container-highest 배경
- **Text Button:** 컨테이너 없음, primary 텍스트, 호버 시 밑줄 또는 앰버 도트

### Bottom Navigation
- 고정, 글래스모피즘 (bg-[#131313]/70 + backdrop-blur-xl)
- 2탭: "메인" (home 아이콘), "지난 기록" (history 아이콘) — 한국어
- 활성 탭: primary-container 배경 + 다크 텍스트, rounded-xl
- 비활성 탭: primary/50 텍스트

### Top App Bar
- 고정, 글래스모피즘 (동일)
- 좌: 유저 아바타(32px 원) + "싱송 다이어리" (primary-container 컬러, bold)
- 우: 로그아웃 아이콘 버튼

## Screens

### 1. 로그인
- 중앙 정렬, 미니멀
- 앱 아이콘 (music_note, 원형 surface-container-highest 배경)
- "싱송 다이어리" display 사이즈 (primary-container)
- "일기를 쓰면, 음악이 됩니다" (primary/60)
- 웨이브폼 장식 (정적, 30% 투명도)
- Google 로그인 버튼 (surface-container-high, 구글 SVG 로고 + "Google 계정으로 시작하기")
- 하단: 개인정보 처리방침 / 이용약관 링크
- 배경: subtle ambient glow (앰버 radial gradient)

### 2. 메인 (일기 작성)
- **데스크톱: 2컬럼 레이아웃**
  - 좌(60%): 날짜 display ("2026.04.07" 또는 "2026년 4월 7일 월요일"), 텍스트에어리어 (min-h-300px, placeholder "오늘 하루는 어땠나요?")
  - 우(40%): "음악 설정" 제목 + 5개 옵션 그룹 칩 UI
- **모바일: 세로 배치** — 일기 영역 → 옵션 영역 순서
- 하단: "음악 만들기" 버튼 (primary-container, rounded-full, 가장 눈에 띄는 요소)
- "오늘 남은 횟수: 2/3" (label 스타일)
- 일기 비어있으면 버튼 비활성화
- 일일 제한 초과 시: 버튼 비활성화 + "오늘 횟수를 모두 사용했어요. 내일 다시 만들 수 있어요."

### 3. 생성 중
- 중앙 정렬
- 앰버 웨이브폼 애니메이션 (CSS 사운드 바, 위아래 높이 변화)
- "음악을 만들고 있어요..." (headline, primary-container)
- 파랑 도트 + "생성 중"
- 일기 텍스트 카드 (읽기 전용, 좌측 primary-container 보더 액센트)
- 선택한 옵션 태그 (surface-container-highest 칩)
- "보통 20~30초 정도 걸려요" (label, on-surface-variant)
- "생성 취소" 버튼 (secondary 스타일)

### 4. 생성 완료
- "당신의 일기가 노래가 되었습니다" 헤드라인
- 뮤직 플레이어 위젯 (앨범 아트 + 제목 + 웨이브폼 + 재생/일시정지 + 시간 + 다운로드)
- 초록 도트 + "생성 완료"
- 일기 카드 (읽기 전용)
- 무드 태그 / 악기 구성 정보
- "다른 스타일로 다시 만들기" 버튼 (secondary) → 메인으로, 같은 일기 텍스트 유지
- "새 일기 쓰기" 버튼 (primary) → 메인 빈 상태

### 5. 생성 실패
- 일기 텍스트 + 옵션 태그 (동일)
- 빨강 도트 + "생성 실패"
- "음악 생성에 실패했어요" 메시지
- "다시 시도" 버튼 (primary) — 같은 내용으로 재요청
- "돌아가기" 버튼 (secondary) → 메인

### 6. 히스토리 (지난 기록)
- "지난 기록" 헤드라인 (display 사이즈)
- 카드 리스트, 최신순:
  - 날짜 (label, primary/60)
  - 일기 제목 또는 발췌 (headline, primary)
  - 일기 본문 발췌 1~2줄 (body, italic, line-clamp-2)
  - 웨이브폼 미니 시각화
  - 메타데이터: 길이, BPM 등 (label)
  - 재생 버튼 (원형, 카드 내)
- 카드별 배경 밝기 변화로 리듬감 (surface-container-low / surface-container-lowest 교차)
- 카드 클릭 → 생성 완료 화면(Screen 4) 레이아웃으로 상세 보기
- **빈 상태:** "아직 기록이 없어요. 첫 번째 일기를 써보세요!" + 메인 이동 버튼

## Stitch 참고

Stitch AI "Amber Resonance" 변형에서 채택한 방향.
- stitch_ai/amber_1 → 생성 중
- stitch_ai/amber_2 → 히스토리
- stitch_ai/amber_3 → 생성 완료
- stitch_ai/amber_4 → 메인 (일기 작성)
- stitch_ai/amber_5 → 로그인

레이아웃/구조는 Stitch 참고하되, 한국어 라벨/옵션 완전 대체, 2컬럼 데스크톱 레이아웃 적용, 30초 고정, 상태 도트 추가, 생성 실패 화면 추가 필요.
