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
```

## 4. 필드 규격 상세

### 4.1 top-level

| Field | Type | Required | Notes |
|---|---|---:|---|
| platform | string | Y | `"musinsa"` |
| source_url | string | Y | 상품 상세 URL |
| product_key | string | Y | `musinsa:goods:<id>` 권장 |
| captured_at | string (ISO8601) | Y | 앱에서 관측한 시간 |
| extractor_version | string | Y | `musinsa_v0_dom` 등 |
| confidence | number(0~1) | Y | 추출 신뢰도 |
| price | object | Y | 가격 |
| stock | object | Y | 재고/상태 |
| debug | object | N | 디버깅(민감정보 금지) |

> `product_key`를 못 얻으면 `musinsa:urlhash:<hash>` 형태를 임시 허용할 수 있으나, 장기적으로는 goods id 추출을 목표로 한다.

### 4.2 price

| Field | Type | Required | Notes |
|---    |---   |---       |---    |  
| sale_price | integer | Y | 표시 판매가 |
| original_price | integer \| null | N | 정가 |
| discount_rate | integer \| null | N | 할인율 |
| currency | string | Y | `KRW` |

가드레일:
- `sale_price <= 0` 이면 400 가능
- `discount_rate`는 보통 0~99 권장

### 4.3 stock

| Field | Type | Required | Notes |
|---    |---   |---:      |---    |
| product_status | string | Y | `on_sale/sold_out/ended/unknown` |
| sizes | object | Y | key는 **라벨 그대로**, value는 `in_stock/sold_out/unknown` |

규칙:
- `unknown`은 상태로 인정
- 새 스냅샷이 일부 사이즈를 누락/unknown으로 보내도 서버는 최신 상태를 함부로 unknown으로 덮지 않는다(오탐 방지 정책은 Restock Spec 참조)

### 4.4 debug (선택)
개인정보/세션/쿠키/토큰 절대 금지.

| Field | Type | Required | Notes |
|---|---|---:|---|
| reason_codes | string[] | N | `blocked_login_required` 등 |
| raw_price_texts | object | N | 근거 텍스트 |
| sizes_found_count | integer | N | 옵션 개수 |
| unknown_size_count | integer | N | unknown 개수 |

---

## 5. Response Schema

### 5.1 성공(200 OK)
```json
{
  "snapshot_id": "snap_01HXYZ...",
  "product_id": "prod_01HABC...",
  "stored": true,
  "server_time": "2026-03-05T12:34:57.120+09:00",
  "normalized": {
    "product_key": "musinsa:goods:1234567",
    "source_url": "https://www.musinsa.com/app/goods/1234567"
  },
  "diff_hint": {
    "restock_candidates": ["M"],
    "price_changed": true
  }
}
```

## 6. 에러 케이스

400 Bad Request
- 필수 필드 누락
- sale_price <= 0
- platform 미지원
- captured_at 형식 오류

401 Unauthorized
- Authorization 헤더 없음
- 토큰 만료
- 토큰 검증 실패

409 Conflict
- 동일 Idempotency-Key로 다른 payload 업로드

422 Unprocessable Entity
- 필드는 맞지만 값이 의미적으로 불가능
- 예: discount_rate 150


## 7. 서버 저장 정책 (요구사항)

서버는 스냅샷을 수신하면 다음 단계를 수행해야 한다.

1. product_key 기준으로 products 테이블을 upsert 한다.

2. 가격 히스토리를 저장한다.
   - 테이블 예시: price_history
   - 필드: product_id, sale_price, original_price, discount_rate, captured_at

3. 재고 히스토리를 저장한다.
   - 테이블 예시: stock_history
   - 필드: product_id, size_label, stock_state, captured_at

4. 최신 상태 캐시를 갱신한다.
   - 테이블 예시: product_latest_state

5. Restock Detector가 비교할 수 있도록 직전 상태(previous state)를 유지한다.


## 8. 레이트리밋 (권장)

서버 레벨

- 기준: user_id + product_id
- 단시간 다량 업로드 발생 시 HTTP 429 반환
- 예: 1분 내 동일 상품 10회 이상 업로드


앱 레벨

- 동일 상품 자동 갱신 쿨다운 권장
- 예: 1시간

단, 사용자가 "지금 확인" 버튼을 누른 경우
- 수동 요청은 허용
- 서버에서 최종 방어


## 9. 보안 및 데이터 정책

다음 데이터는 절대 업로드하면 안 된다.

- 쿠키
- 세션 토큰
- 로그인 정보
- Authorization 헤더 값
- 개인 식별 정보

debug 필드는 오직 다음과 같은 정보만 허용된다.

- DOM 텍스트
- 파싱된 가격 문자열
- 사이즈 옵션 개수
- extractor 실패 이유 코드


## 10. 버전 정책

Snapshot API는 extractor 버전과 함께 사용된다.

예시:

extractor_version
- musinsa_v0_dom
- musinsa_v1_dom
- musinsa_v1_network

서버는 extractor_version을 저장하여
- 파싱 오류 분석
- extractor 업데이트 추적
- 특정 버전 필터링

을 가능하게 한다.


## 11. 향후 확장 계획 (v1 이후)

다음 기능은 v0 범위에는 포함되지 않지만 향후 확장 가능하다.

1. 가격 변동 이벤트 생성
2. 재입고 이벤트 생성
3. 알림 큐 생성
4. 사용자별 watchlist 자동 스캔
5. 다중 플랫폼 지원
   - musinsa
   - 29cm
   - wconcept
