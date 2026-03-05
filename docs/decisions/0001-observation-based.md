# ADR 0001: Observation-based data collection

## Decision
서버 크롤링이 아닌, 클라이언트(WebView) 관측 기반으로 스냅샷을 수집한다.

## Rationale
- 플랫폼 API 제약 및 서버 크롤링 리스크를 낮춤
- 사용자 액션(지금 확인하기)과 결합하여 UX 유지
- 유저 수 증가 시 관측 빈도 상승(네트워크 효과)

## Consequences
- 관측 공백 발생 가능 → 마지막 확인 시간 노출 + 확인 요청 알림으로 보완
