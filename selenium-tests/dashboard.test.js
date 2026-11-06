const { Builder, By, until } = require('selenium-webdriver');

async function testDashboard() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');

        await driver.get('http://localhost:3003');

        await driver.wait(until.titleIs('ShopEase - Online Shopping'), 10000);

        console.log('Page title:', await driver.getTitle());
        console.log('PASS: Shopping dashboard loaded successfully.');

        const products = await driver.findElements(By.className('product-card'));

        console.log('Products displayed:', products.length);

        if (products.length > 0) {
            console.log('PASS: Products are visible.');
        } else {
            console.log('FAIL: No products found.');
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testDashboard();