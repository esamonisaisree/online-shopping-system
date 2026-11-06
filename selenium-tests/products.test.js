const { Builder, By, until } = require('selenium-webdriver');

async function testProducts() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');
        await driver.get('http://localhost:3003');

        await driver.executeScript(
            "showSection('productsSection')"
        );

        await driver.wait(
            until.elementsLocated(By.className('product-card')),
            10000
        );

        const products = await driver.findElements(
            By.className('product-card')
        );

        console.log('Products displayed:', products.length);

        if (products.length >= 6) {
            console.log('PASS: Products loaded successfully.');
        } else {
            console.log('FAIL: Expected at least 6 products.');
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testProducts();