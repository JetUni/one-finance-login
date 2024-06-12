import { readFileSync, writeFileSync } from 'fs';
import puppeteer, { Browser } from 'puppeteer';
import readline from 'readline/promises';
import { checkForElementToIndicateSuccessfulLogin, inputMobileCode, inputPhoneNumber, inputPinCode } from './login';

const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
}

main()
  .catch((error) => console.error(error))
  .finally(async () => {
    await browser.close();
    process.exit();
  });
