// index.js
const express = require('express');
const cors = require('cors');

// 🌟 일반 puppeteer가 아닌, 봇 방어막을 뚫는 'puppeteer-extra'를 사용합니다.
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 스텔스 플러그인 장착 (이게 없으면 크림, 나이키에서 100% 차단당함)
puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json()); // JSON 형태의 요청 Body를 파싱하기 위함

const PORT = 3000;

// API 엔드포인트: 상품 URL을 받아서 스크래핑 후 결과 반환
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL을 입력해주세요.' });
    }

    console.log(`[Scraping Start] 타겟 URL: ${url}`);
    
    let browser;
    try {
        // 1. 눈에 보이지 않는 크롬 브라우저 실행
        browser = await puppeteer.launch({
            headless: "new", // 백그라운드에서 실행 (화면 안 띄움)
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // 서버 배포 시 필수 옵션
        });

        const page = await browser.newPage();

        // 2. 모바일 환경인 척 속이기 (User-Agent 조작)
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844, isMobile: true });

        // 3. 페이지 접속 (네트워크 요청이 어느 정도 잦아들 때까지 최대 15초 대기)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        // 4. 페이지 내부에서 실행될 JavaScript 주입 (질문자님의 로직 100% 이식!!!)
        const extractData = await page.evaluate(() => {
            // --- 여기서부터는 브라우저 내부(DOM)에서 실행됩니다 ---
            
            function cleanText(txt) {
                if (!txt) return "";
                return String(txt).replace(/\s+/g, " ").trim();
            }

            function toIntPrice(txt) {
                if (!txt) return null;
                const m = (txt + '').match(/[0-9][0-9,]*/g);
                if (!m) return null;
                const n = parseInt(m[0].replace(/,/g,''), 10);
                if (!Number.isFinite(n) || n <= 0 || n > 1000000000) return null;
                return n;
            }

            // 상품명 추출
            function guessProductName() {
                const metaOg = document.querySelector('meta[property="og:title"]');
                if (metaOg && metaOg.content.length >= 3) return cleanText(metaOg.content);

                const h1 = document.querySelector("h1");
                const h1Text = cleanText(h1 ? h1.textContent : "");
                if (h1Text && h1Text.length >= 3) return h1Text;

                return cleanText(document.title || "상품명을 찾을 수 없음");
            }

            // 가격 추출
            function guessSalePrice() {
                const texts = [];
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                let node;
                while ((node = walker.nextNode())) {
                    const t = cleanText(node.nodeValue || "");
                    if (t.includes("원") && /[0-9]/.test(t)) texts.push(t);
                    if (texts.length > 80) break;
                }
                const nums = texts.map(toIntPrice).filter(Boolean);
                if (!nums.length) return null;
                return Math.min.apply(null, nums); // 찾은 가격 중 최저가 반환
            }

            // 대표 이미지 썸네일 추출 (새로 추가해드린 꿀팁 기능!)
            function guessImageUrl() {
                const metaImg = document.querySelector('meta[property="og:image"]');
                if (metaImg && metaImg.content) return metaImg.content;
                return null;
            }

            // 최종 데이터 조합
            return {
                name: guessProductName(),
                price: guessSalePrice(),
                imageUrl: guessImageUrl(),
            };
        });

        // 5. 추출 완료 및 브라우저 종료
        await browser.close();

        console.log(`[Scraping Success] 상품명: ${extractData.name}, 가격: ${extractData.price}`);

        // 6. 앱(프론트엔드)으로 결과 전송
        return res.json({
            success: true,
            data: {
                siteUrl: url,
                name: extractData.name,
                currentPrice: extractData.price,
                imageUrl: extractData.imageUrl,
            }
        });

    } catch (error) {
        console.error(`[Scraping Error]`, error.message);
        if (browser) await browser.close();
        
        return res.status(500).json({ 
            success: false, 
            error: '상품 정보를 가져오는데 실패했습니다. (방어막에 막혔거나 타임아웃)' 
        });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 Price Tracker 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
