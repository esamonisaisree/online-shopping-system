const { Builder, By, until } = require('selenium-webdriver');

async function testAuthentication() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        console.log('Opening ShopEase...');
        await driver.get('http://localhost:3003');

        // Open registration section directly
        await driver.executeScript(
            "showSection('registerSection')"
        );

        await driver.wait(
            until.elementIsVisible(
                driver.findElement(By.id('registerName'))
            ),
            5000
        );

        await driver.findElement(By.id('registerName'))
            .sendKeys('Selenium Customer');

        await driver.findElement(By.id('registerEmail'))
            .sendKeys(`selenium${Date.now()}@gmail.com`);

        await driver.findElement(By.id('registerPassword'))
            .sendKeys('Test@123');

        await driver.findElement(
            By.xpath("//button[contains(text(),'Register')]")
        ).click();

        await driver.sleep(2000);

        console.log('PASS: Registration form submitted.');

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await driver.quit();
    }
}

testAuthentication();