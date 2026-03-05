
# Restock Detector Spec v0

## 목적
- 스냅샷(`/v1/snapshots`)이 들어올 때마다 서버가 **이전 상태 vs 현재 상태**를 비교해서
- 특정 사이즈 기준으로 `sold_out → in_stock` 변화가 관측되면 **재입고 이벤트를 생성**하고
- 해당 사이즈 재입고 알림을 켜둔 사용자에게 **푸시 알림**을 발송한다.
- B안 정책: **관측 기반**이며, UI에 “마지막 확인 시간(last_checked)”을 노출한다.

---

## 1) 용어/데이터 모델

### 1.1 상태 정의
- SizeStatus: `in_stock | sold_out | unknown`
- ProductStatus: `on_sale | sold_out | ended | unknown`

### 1.2 “특정 사이즈 재입고” 정의 (핵심)
- 이벤트 대상 사이즈 `S`에 대해
  - `prev_size_status(S) == sold_out`
  - `curr_size_status(S) == in_stock`
- 이 조건을 만족하면 `restock` 이벤트 생성.

> 주의: `unknown → in_stock` 은 “재입고”로 **간주하지 않음** (오탐 방지)  
> 단, 나중에 옵션으로 “unknown→in_stock도 알림”을 켤 수 있게 확장 가능.

---

## 2) 입력/출력

### 2.1 입력
- 최신 SnapshotPayload (App → Server 업로드 데이터)
- 서버에 저장된 이전 “LatestStockState”(상품별/사이즈별 최근 상태)

### 2.2 출력
- RestockEvent(생성 시)
- NotificationRequest(알림 발송 작업 큐에 enqueue)

---

## 3) 저장 구조(서버 내부 요구사항)

### 3.1 latest_product_state (권장: 물리 테이블 또는 materialized view)
- product_id
- last_checked_at (마지막 관측 시각)
- product_status_latest

사이즈별 latest 상태는 별도 테이블 추천:
- `latest_size_state(product_id, size_label, status, updated_at)`

### 3.2 stock_history (히스토리)
- snapshot_id
- product_id
- size_label
- status
- captured_at

---

## 4) 이벤트 생성 로직

### 4.1 처리 흐름
1) Snapshot 저장(히스토리)  
2) latest 상태 조회(이전 상태 확보)  
3) 사이즈별 diff 계산  
4) RestockEvent 후보 생성  
5) 디듀프/쿨다운 체크  
6) 이벤트 확정 → 알림 대상자 조회 → 발송 큐 enqueue  
7) latest 상태 업데이트  
8) last_checked_at 업데이트

### 4.2 사이즈 diff 계산 규칙
- `curr_sizes`에 포함된 라벨만 비교 (라벨 그대로)
- 비교 시 누락된 라벨:
  - 이전에는 있었는데 이번에는 없다 → `unknown`으로 덮지 않는다(데이터 품질 이슈로 오탐 방지)
- `curr_sizes[size] == unknown`이면, 해당 사이즈 latest 업데이트를 스킵(기존 유지)

> 핵심: “unknown이 들어왔다고 최신 상태를 unknown으로 덮어버리면” 재입고 감지가 깨짐.

---

## 5) 디듀프/쿨다운(기본값 적용)

### 5.1 이벤트 디듀프 키
- `dedupe_key = restock:{product_id}:{size_label}`

### 5.2 쿨다운 정책 (디폴트)
- 동일 `product_id + size_label` restock 이벤트는 **1시간 쿨다운**
- 1시간 내 반복 재입고 알림 폭탄 방지

구현 예:
- Redis에 `dedupe_key`를 TTL=3600으로 `SET NX`
  - 성공 시 이벤트 발행
  - 실패 시 이벤트 drop(또는 저장만 하고 알림 skip)

---

## 6) 알림 대상자 선정

### 6.1 tracking 테이블 가정
- user_id
- product_id
- target_size_label (예: "M")
- restock_alert_enabled (bool)

### 6.2 대상자 쿼리
- 조건:
  - `product_id == event.product_id`
  - `target_size_label == event.size_label`
  - `restock_alert_enabled == true`

---

## 7) 알림 메시지 규격(가격 포함 + 딥링크)

### 7.1 푸시 템플릿
- Title: `📦 {size_label} 사이즈 재입고`
- Body: `{product_name}\n현재 가격 {sale_price_formatted}`
- Deep Link: `app://product/{product_id}?size={size_label}`

> 알림 탭 시 앱은 해당 상품 화면으로 이동(B안)

---

## 8) “마지막 확인 시간” 갱신 규칙 (B안 핵심)
- 스냅샷이 성공적으로 처리되면:
  - `latest_product_state.last_checked_at = max(old, snapshot.captured_at)`
- 앱 UI에는 “마지막 확인: n시간 전” 표시

---

## 9) 확인 요청 알림(관측 공백 대응) — 디폴트 정책 반영

### 9.1 트리거 조건
- `now - last_checked_at > 12시간`
- AND 해당 상품에 대해 restock 알림이 켜진 트래킹이 1개 이상 존재

### 9.2 쿨다운
- 유저당/상품당 하루 1회(24h)

### 9.3 메시지
- Title: `재고 확인이 필요해요`
- Body: `{product_name} ({size_label}) 재입고 알림 정확도를 높이려면 한 번만 확인해 주세요`
- Deep Link: `app://product/{product_id}?action=check_now`

> 이 알림은 “재입고 알림”이 아니라 “관측을 유도”하는 목적임.

---

## 10) 의사코드 (서버)

```pseudo
onSnapshotReceived(snapshot):
  product = upsertProduct(snapshot.product_key, snapshot.source_url, ...)

  prev_latest = loadLatestProductState(product.id)
  prev_sizes = loadLatestSizeStates(product.id)  // map size->status

  // 1) compute restock candidates
  restock_sizes = []
  for (size_label, curr_status) in snapshot.stock.sizes:
      if curr_status == unknown:
          continue
      prev_status = prev_sizes.get(size_label, unknown)
      if prev_status == sold_out and curr_status == in_stock:
          restock_sizes.append(size_label)

  // 2) store history (price + stock)
  storePriceHistory(product.id, snapshot.price, snapshot.captured_at)
  storeStockHistory(product.id, snapshot.stock.sizes, snapshot.captured_at)

  // 3) update latest states safely
  updateLatestProductState(product.id, snapshot.stock.product_status, snapshot.captured_at)
  for (size_label, curr_status) in snapshot.stock.sizes:
      if curr_status != unknown:
          upsertLatestSizeState(product.id, size_label, curr_status, snapshot.captured_at)

  // 4) emit events with cooldown
  for size_label in restock_sizes:
      if acquireCooldown("restock:{product.id}:{size_label}", ttl=3600):
          createRestockEvent(product.id, size_label, snapshot.captured_at, snapshot.price.sale_price)
          users = findUsersTracking(product.id, size_label, restock_alert_enabled=true)
          enqueuePush(users, payloadWithPriceAndDeepLink)

  // 5) schedule check-request notifications (optional job)
  // handled by periodic job using last_checked_at + cooldown keys
