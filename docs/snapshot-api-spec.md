# Snapshot API Spec v0 (App → Server)

## 0. 목적
- RN 앱이 WebView에서 추출한 가격/재고 상태를 **스냅샷 형태로 서버에 업로드**
- 서버는 스냅샷을 저장하고, 이전 상태와 비교해 **이벤트(재입고/가격)**를 생성할 준비를 함

---

## 1. 인증/권한
### 1.1 인증 방식 (MVP)
- `Authorization: Bearer <access_token>` (JWT)

---

## 2. 엔드포인트

### 2.1 스냅샷 업로드
`POST /v1/snapshots`

**설명**  
- 특정 상품 URL에 대해 앱이 관측한 최신 상태를 업로드한다.
- 서버는 저장 후 “변화 감지(디프)”를 수행할 수 있도록 최신 상태를 갱신한다.

---

## 3. Request Schema

### 3.1 Headers
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Idempotency-Key: <uuid>` (권장: 네트워크 재시도 시 중복 저장 방지)

### 3.2 Body (SnapshotPayload)
```json
{
  "platform": "musinsa",
  "source_url": "https://www.musinsa.com/app/goods/1234567",
  "product_key": "musinsa:goods:1234567",
  "captured_at": "2026-03-05T12:34:56.000+09:00",
  "extractor_version": "musinsa_v0_dom",
  "confidence": 0.86,
  "price": {
    "sale_price": 89000,
    "original_price": 129000,
    "discount_rate": 31,
    "currency": "KRW"
  },
  "stock": {
    "product_status": "on_sale",
    "sizes": {
      "S": "sold_out",
      "M": "in_stock",
      "L": "in_stock",
      "XL": "sold_out"
    }
  },
  "debug": {
    "reason_codes": [],
    "raw_price_texts": {
      "sale": "89,000원",
      "original": "129,000원",
      "discount": "31%"
    },
    "sizes_found_count": 4,
    "unknown_size_count": 0
  }
}
