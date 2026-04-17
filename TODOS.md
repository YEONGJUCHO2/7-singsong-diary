# TODOS

## Lyria Pro 3분 모드 확장
- **What:** Lyria Pro (3분 트랙) 지원 추가
- **Why:** 현재 Clip (30초)만 지원. 더 긴 트랙은 일기의 감정을 더 풍부하게 표현 가능.
- **Pros:** 사용자 경험 대폭 향상, 더 의미있는 음악
- **Cons:** Edge Function 타임아웃 초과 (최대 3분 소요). 2단계 패턴(시작 함수 + 별도 폴링/콜백) 필요. 비용 증가.
- **Context:** Supabase Edge Function 기본 타임아웃 ~60초. Lyria Pro는 최대 180초 소요. 시작 함수가 요청을 큐에 넣고, 별도 워커(또는 pg_cron + Edge Function)가 처리하는 패턴 검토. 클라이언트는 기존 Realtime subscription으로 상태 수신 (추가 변경 불필요).
- **Depends on:** 기본 Clip 모드 안정화 후

## E2E 테스트 (Playwright)
- **What:** 전체 플로우 E2E 테스트 추가
- **Why:** Codex 리뷰에서 지적. 단위 테스트만으로는 통합 실패를 잡기 어렵고, 진짜 중요한 테스트는 전체 흐름 검증.
- **Pros:** 로그인 -> 일기 작성 -> 음악 생성 -> 재생 전체 흐름 자동 검증. 리그레션 방지.
- **Cons:** Playwright 설정 + Supabase 로컬 환경 필요. Lyria API 모킹 전략 필요 (실제 API 호출은 비용+시간 문제).
- **Context:** 테스트 대상: (1) 로그인 -> 메인 (2) 일기+옵션 -> 제출 -> 생성 완료 -> 재생 (3) 실패 -> 재시도 (4) 히스토리 목록. Lyria API는 MSW 또는 Edge Function 레벨에서 모킹.
- **Depends on:** 기본 기능 구현 완료 후
