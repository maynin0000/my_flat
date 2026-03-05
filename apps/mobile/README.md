# Mobile (React Native / Expo)

## MVP 목표
- 링크 등록 화면
- 상품 화면(WebView) + 추출 + Snapshot 업로드
- 트래킹 리스트 화면
- 푸시 알림 클릭 시 상품 화면 딥링크 이동

## 핵심 메모
- WebView DOM 추출(v0)로 먼저 성공
- 추출 실패/unknown 많으면 “지금 확인하기”로 재시도 UX 제공
- “마지막 확인 시간”을 카드에 표시(B안)
