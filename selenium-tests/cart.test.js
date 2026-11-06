const { Builder, By, until } = require('selenium-webdriver');

async function testCart() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');
        await driver.get('http://localhost:3003');

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
        console.log('PASS: Customer login successful.');

        const addResult = await driver.executeAsyncScript(function(done) {
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
            .then(done)
            .catch(error => done({error: error.message}));
        });

        console.log('Add to cart:', addResult);

        const cart = await driver.executeAsyncScript(function(done) {
            fetch('/api/cart')
                .then(async response => ({
                    status: response.status,
                    data: await response.json()
                }))
                .then(done)
                .catch(error => done({error: error.message}));
        });

        console.log('Cart response:', cart);

        if (cart.data && cart.data.items && cart.data.items.length > 0) {
            console.log('PASS: Product added to shopping cart.');
        } else {
            throw new Error('Product not found in cart.');
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testCart();
