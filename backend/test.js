// test.js
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(bodyStr, 'utf8'),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr, 'utf8');
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET' }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Fashion Price Backend 테스트 시작\n');

  // 테스트 1: 인기 검색어
  console.log('── 인기 검색어 ──');
  const popular = await get('/api/search/popular');
  console.log('인기 검색어:', popular.keywords?.slice(0, 5).join(', '));

  // 테스트 2: 상품 검색
  console.log('\n── 아디다스 삼바 검색 ──');
  const result = await post('/api/search', { keyword: '아디다스 삼바' });

  if (result.success) {
    console.log(`✅ 성공 (${result.elapsed}ms)`);
    console.log(`총 마스터 상품: ${result.totalCount}개\n`);

    result.masterProducts?.slice(0, 3).forEach((mp, i) => {
      console.log(`[${i + 1}] ${mp.name}`);
      console.log(`    SKU: ${mp.sku || '없음'} | 브랜드: ${mp.brand || '없음'}`);
      console.log(`    최저가: ${mp.lowestMall} ${mp.lowestPrice?.toLocaleString()}원`);
      console.log(`    플랫폼 수: ${mp.platformCount}개`);

      if (mp.regularOffers?.length > 0) {
        console.log('    [일반몰]');
        mp.regularOffers.forEach(o => {
          console.log(`      ${o.mallLabel}: ${o.price?.toLocaleString()}원`);
        });
      }

      if (mp.resellOffers?.length > 0) {
        console.log('    [리셀]');
        mp.resellOffers.forEach(o => {
          console.log(`      ${o.mallLabel}: ${o.price?.toLocaleString()}원~`);
        });
      }
      console.log('');
    });
  } else {
    console.log('❌ 실패:', result.error);
  }

  console.log('🧪 테스트 완료\n');
}

runTests().catch(console.error);
