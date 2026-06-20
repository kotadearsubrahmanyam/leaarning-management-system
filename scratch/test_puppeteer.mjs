import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log("Creating page...");
        const page = await browser.newPage();
        await page.setContent('<h1>Test PDF Generation</h1><p>Hello from Puppeteer!</p>');
        console.log("Generating PDF...");
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } 
        });
        fs.writeFileSync('scratch/test_puppeteer.pdf', pdfBuffer);
        await browser.close();
        console.log("Success generating PDF with Puppeteer!");
    } catch (e) {
        console.error("Puppeteer test failed:", e);
    }
}

run();
