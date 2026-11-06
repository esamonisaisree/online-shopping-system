const { Builder, By } = require('selenium-webdriver');

async function testAdmin() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');

        await driver.get('http://localhost:3003');

        // Open login section
        await driver.executeScript("showSection('loginSection')");

        // Admin login
        await driver.findElement(By.id('loginEmail'))
            .sendKeys('admin@shop.com');

        await driver.findElement(By.id('loginPassword'))
            .sendKeys('Admin@123');

        await driver.findElement(
            By.xpath("//section[@id='loginSection']//button[contains(text(),'Login')]")
        ).click();

        await driver.sleep(2000);

        // Verify admin session
        const session = await driver.executeAsyncScript(function(done) {
            fetch('/api/me')
                .then(async response => ({
                    status: response.status,
                    data: await response.json()
                }))
                .then(done);
        });

        if (session.status !== 200 || session.data.user.role !== 'admin') {
            throw new Error('Admin login failed');
        }

        console.log('PASS: Admin login successful.');

        // Open admin dashboard
        await driver.executeScript("showSection('adminSection')");

        await driver.sleep(2000);

        const products = await driver.findElements(
            By.className('product-card')
        );

        console.log('Admin products displayed:', products.length);

        if (products.length > 0) {
            console.log('PASS: Admin product management page loaded.');
        } else {
            throw new Error('No products displayed in admin dashboard');
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testAdmin();