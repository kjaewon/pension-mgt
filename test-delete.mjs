import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console logs
    page.on('console', msg => {
        console.log('CONSOLE:', msg.text());
    });

    // Catch unhandled exceptions
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    page.on('dialog', async dialog => {
        console.log('DIALOG:', dialog.message());
        await dialog.accept(); // click OK on confirm
    });

    console.log('Testing delete account...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Wait for data load
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if the minus button exists
    const minusBtn = await page.$('button[title="현재 선택된 계좌 탭 삭제"]');
    if (minusBtn) {
        console.log('Found minus button, clicking it...');
        await minusBtn.click();
        
        // Wait to see if any alert shows or state changes
        await new Promise(r => setTimeout(r, 2000));
    } else {
        console.log('Minus button not found! Maybe only 1 account exists.');
    }
    
    await browser.close();
})();
