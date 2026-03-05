# API (FastAPI)

## MVP 목표
- POST /v1/snapshots 구현
- 스냅샷 저장(가격/재고 히스토리)
- latest 상태 유지
- Restock Detector: sold_out → in_stock 이벤트 생성 + 푸시 큐 적재

## 문서 참조
- docs/snapshot-api-spec.md
- docs/restock-detector-spec.md
