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

    console.log('Navigating...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Wait for data load
    await new Promise(r => setTimeout(r, 2000));
    
    const tabs = await page.$$('div.flex.items-center.space-x-2.border-b > button:not([title])');
    console.log(`Found ${tabs.length} generic tab buttons`);
    
    const btn = await page.$('button[title="현재 선택된 계좌 탭 삭제"]');
    if (btn) {
        console.log('Minus button found.');
        
        // Evaluate if the button is actually clickable and visible
        const isClickable = await page.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none' && rect.width > 0 && rect.height > 0;
        }, btn);
        
        console.log('Is clickable? ', isClickable);
        
        // Dispatch click via JS directly to bypass any pointer-events blocking
        console.log('Clicking directly via element.click()');
        await page.evaluate((el) => el.click(), btn);
        await new Promise(r => setTimeout(r, 2000));
        
    } else {
        console.log('Minus button NOT found.');
    }
    
    await browser.close();
})();
