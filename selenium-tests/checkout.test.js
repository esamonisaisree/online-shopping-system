const { Builder, By, until } = require('selenium-webdriver');

async function testCheckout() {
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

const message = await driver.findElement(By.id('message')).getText();
console.log('Login message:', message);

const session = await driver.executeAsyncScript(function(done) {
    fetch('/api/me')
        .then(async response => ({
            status: response.status,
            data: await response.json()
        }))
        .then(done);
});

console.log('Session response:', session);

if (session.status !== 200) {
    throw new Error('Customer login failed');
}

        console.log('PASS: Customer login successful.');

        // Add product to cart
        const result = await driver.executeAsyncScript(function(done) {
            fetch('/api/cart', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    productId: 1,
                    quantity: 1
                })
            })
            .then(async response => ({
                status: response.status,
                data: await response.json()
            }))
            .then(done);
        });

        if (result.status !== 200 && result.status !== 201) {
            throw new Error('Unable to add product to cart');
        }

        console.log('PASS: Product added to cart.');

        // Open cart
        await driver.executeScript("showCart()");

        await driver.wait(
    until.elementIsVisible(
        driver.findElement(By.xpath("//button[contains(text(),'Place Order')]"))
    ),
    10000
);

        // Place order
        await driver.findElement(
    By.xpath("//button[contains(text(),'Place Order')]")
).click();

        await driver.sleep(2000);

        console.log('Checkout message:',
            await driver.findElement(By.id('message')).getText()
        );

        console.log('PASS: Checkout test completed.');

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testCheckout();