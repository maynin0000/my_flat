# FitTiming (working title)

패션 플랫폼 상품의 가격/사이즈 재고 상태를 관측 기반으로 추적하고,
특정 사이즈 재입고 및 가격 변화를 알림으로 제공하는 MVP.

## MVP 핵심
- 링크 등록 → WebView 관측 → Snapshot 업로드
- 사이즈별 sold_out / in_stock 추적 (라벨 그대로)
- 특정 사이즈 재입고(sold_out→in_stock) 알림 (푸시)
- 쿠폰 입력 기반 예상 결제가 계산

## 문서
- docs/PRD.md
- docs/extractor-spec.md
- docs/snapshot-api-spec.md
- docs/restock-detector-spec.md

## 저장소 구조
- apps/mobile: React Native(Expo)
- services/api: FastAPI
- openapi/openapi.yaml: API 계약
