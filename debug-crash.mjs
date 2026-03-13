import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
        }
    });

    // Catch unhandled exceptions
    page.on('pageerror', error => {
        console.log('\n\n=== PAGE ERROR ===');
        console.log(error.message);
        console.log(error.stack);
        console.log('==================\n\n');
    });

    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    console.log('Waiting 5 seconds to let React crash...');
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
})();
