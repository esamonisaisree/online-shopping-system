const { Builder, By } = require('selenium-webdriver');

async function testOrders() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');

        await driver.get('http://localhost:3003');

        // Login
        await driver.executeScript("showSection('loginSection')");

        await driver.findElement(By.id('loginEmail'))
            .sendKeys('seleniumcustomer@gmail.com');

        await driver.findElement(By.id('loginPassword'))
            .sendKeys('Test@123');

        await driver.findElement(
            By.xpath("//section[@id='loginSection']//button[contains(text(),'Login')]")
        ).click();

        await driver.sleep(2000);

        const session = await driver.executeAsyncScript(function(done) {
            fetch('/api/me')
                .then(async response => ({
                    status: response.status,
                    data: await response.json()
                }))
                .then(done);
        });

        if (session.status !== 200) {
            throw new Error('Customer login failed');
        }

        console.log('PASS: Customer login successful.');

        // Open order history
        await driver.executeScript("showOrders()");

        await driver.sleep(2000);

        const orders = await driver.findElements(
            By.className('product-card')
        );

        console.log('Orders displayed:', orders.length);

        if (orders.length > 0) {
            console.log('PASS: Order history displayed successfully.');
        } else {
            console.log('FAIL: No orders found.');
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testOrders();