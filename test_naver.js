import axios from 'axios';

async function testNaver() {
    try {
        const response = await axios.get('https://m.stock.naver.com/api/stock/005930/basic', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Naver Data:', response.data);
    } catch (e) {
        console.error('Naver Error:', e.message);
    }
}

testNaver();
