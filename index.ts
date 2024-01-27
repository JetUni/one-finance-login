import { EventEmitter } from 'events';
import { readFileSync, writeFileSync } from 'fs';
import puppeteer, { Browser } from 'puppeteer';
import readline from 'readline/promises';
import { pocketsEventHandler, transactionsEventHandler } from './api-response-handler';
import { checkForElementToIndicateSuccessfulLogin, inputMobileCode, inputPhoneNumber, inputPinCode } from './login';
import { collectPageResponses } from './page-response-handler';

const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const apiEventEmitter = new EventEmitter();

interface OneUserSession {
  createdTime: number;
  expirationTime: number;
  isStepUpToken: boolean;
  passcodeUserEmail: string;
  refreshToken: string;
  token: {
    accessToken: string;
    expiresIn: number;
    idToken: string;
    refreshToken: string;
    scope: string;
    tokenType: 'Bearer';
  };
  userId: string;
}

let browser: Browser;
const sessionFileName = './one-user-session.json';

async function main() {
  let isUserLoggedIn = false;
  let oneUserSession: OneUserSession | undefined;
  let userId: string | undefined;

  // Launch the browser and open a new blank page
  browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: false,
    timeout: 180000,
  });

  const [page] = await browser.pages();
  // Set screen size
  // await page.setViewport({ width: 1080, height: 1024 });

  // Try to restore the session saved to the file
  try {
    const sessionString = readFileSync(sessionFileName).toString();
    oneUserSession = JSON.parse(sessionString);
    userId = oneUserSession?.userId;
  } catch (error) {}

  // collects all pertinent responses
  collectPageResponses(page, apiEventEmitter);
  pocketsEventHandler(apiEventEmitter);
  transactionsEventHandler(apiEventEmitter);

  // Navigate the page to a URL
  await page.goto('https://web.one.app/');
  if (oneUserSession) {
    const reload = await page.evaluate((oneUserSession) => {
      window.sessionStorage.setItem('one_user_session', JSON.stringify(oneUserSession));
      return true;
    }, oneUserSession);
    if (reload) {
      await page.reload();
      await page.waitForNavigation();
      console.log('Finished reloading');
    }
  }
  isUserLoggedIn = await checkForElementToIndicateSuccessfulLogin(page);

  if (!isUserLoggedIn) {
    await inputPhoneNumber(page, readLine);
    await inputMobileCode(page, readLine);
    await inputPinCode(page, readLine);
    isUserLoggedIn = await checkForElementToIndicateSuccessfulLogin(page);
  }

  // Get User session and write it to filesystem so we can skip the login steps next time
  if (isUserLoggedIn) {
    const oneUserSession = await page.evaluate(() => window.sessionStorage.getItem('one_user_session'));
    if (oneUserSession) {
      writeFileSync(sessionFileName, oneUserSession);
    }
  }

  // Checking Account
  const checkingTabSelector = 'a[data-testid="checking-tab"]';
  const checkingTabElement = await page.waitForSelector(checkingTabSelector);
  await checkingTabElement?.evaluate((el) => el.click());
  // await page.click(checkingTabSelector);

  const checkingBalanceSelector = 'div[data-testid="spend-account-balance-subheader"]';
  const checkingBalanceElement = await page.waitForSelector(checkingBalanceSelector);
  console.log('Checking Balance:', await checkingBalanceElement?.evaluate((el) => el.textContent));

  // Savings Accounts Overview
  const savingsTabSelector = 'a[data-testid="savings-tab"]';
  const savingsTabElement = await page.waitForSelector(savingsTabSelector);
  await savingsTabElement?.evaluate((el) => el.click());

  const savingsBalanceSelector = 'div[data-testid="save-account-balance-subheader"]';
  const savingsBalanceElement = await page.waitForSelector(savingsBalanceSelector);
  console.log('Savings Balance:', await savingsBalanceElement?.evaluate((el) => el.textContent));

  // Save Pockets - Default
  const defaultSavePocketsSelector = 'div[data-testid="default-save-pockets-list-container"]';
  const defaultSavePocketsTestIds = await page.evaluate((selector) => {
    const containerList = Array.from(document.querySelector(selector)?.children ?? []);
    return containerList.map((pocket) => pocket.children[0].getAttribute('data-testid'));
  }, defaultSavePocketsSelector);
  console.log('Default Save Pockets:', defaultSavePocketsTestIds);

  // Iterate Default Save Pockets
  for await (const testId of defaultSavePocketsTestIds) {
    const pocketElement = await page.waitForSelector(`div[data-testid="${testId}"]`);
    await pocketElement?.evaluate((el) => el.click());
    const balanceElement = await page.waitForSelector('div[data-testid="save-pocket-balance"]');
    console.log('Save pocket balance:', await balanceElement?.evaluate((el) => el.textContent));
    const backButtonElement = await page.waitForSelector('div[data-testid="back-nav-title"]');
    await backButtonElement?.evaluate((el) => el.click());
  }

  // Save Pockets - User Created/Shared
  const userSavePocketsSelector = 'div[data-testid="user-created-or-shared-pockets-list-container"]';
  const userSavePocketsTestIds = await page.evaluate((selector) => {
    const containerList = Array.from(document.querySelector(selector)?.children ?? []);
    return containerList.map((pocket) => pocket.children[0].getAttribute('data-testid'));
  }, userSavePocketsSelector);
  console.log('User Save Pockets:', userSavePocketsTestIds);

  // Iterate User Save Pockets
  for await (const testId of userSavePocketsTestIds) {
    const pocketElement = await page.waitForSelector(`div[data-testid="${testId}"]`);
    await pocketElement?.evaluate((el) => el.click());
    const balanceElement = await page.waitForSelector('div[data-testid="save-pocket-balance"]');
    console.log('Save pocket balance:', await balanceElement?.evaluate((el) => el.textContent));
    const backButtonElement = await page.waitForSelector('div[data-testid="back-nav-title"]');
    await backButtonElement?.evaluate((el) => el.click());
  }

  // PUT NEW CODE ABOVE THIS
  // wait here so all the current requests can finish
  await new Promise((resolve) => setTimeout(resolve, 5000));
  // wait here so we can figure out what to do next and keep the browser open
  await readLine.question('hit ENTER when finished\n');
}

main()
  .catch((error) => console.error(error))
  .finally(async () => {
    await browser.close();
    process.exit();
  });
