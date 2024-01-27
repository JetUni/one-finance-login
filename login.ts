import { Page } from 'puppeteer';
import readline from 'readline/promises';

/**
 * Type into mobile number input
 * @param page The Puppeteer page to search for the selector and input the phone number
 * @param readLine Used for gathering input from the user through the terminal
 */
export async function inputPhoneNumber(page: Page, readLine: readline.Interface) {
  const phoneNumberInputSelector = "input[data-testid='phone-number-input']";
  const phoneNumber = await readLine.question('Enter your phone number: ');
  await page.waitForSelector(phoneNumberInputSelector);
  await page.type(phoneNumberInputSelector, phoneNumber, { delay: 10 });
  await page.keyboard.press('Enter');
}

/**
 * Type into mobile code input
 * @param page The Puppeteer page to search for the selector and input the phone number
 * @param readLine Used for gathering input from the user through the terminal
 */
export async function inputMobileCode(page: Page, readLine: readline.Interface) {
  const passwordlessInputSelector = "input[data-testid='passwordless-input']";
  const passwordlessCode = await readLine.question('Enter the code sent to your phone: ');
  await page.waitForSelector(passwordlessInputSelector);
  await page.type(passwordlessInputSelector, passwordlessCode);
}

/**
 * Type into pin code input
 * @param page The Puppeteer page to search for the selector and input the phone number
 * @param readLine Used for gathering input from the user through the terminal
 */
export async function inputPinCode(page: Page, readLine: readline.Interface) {
  const passcodeInputSelector = "input[data-testid='passcode-input']";
  const pinCode = await readLine.question('Enter the pin code for the account: ');
  await page.waitForSelector(passcodeInputSelector);
  await page.type(passcodeInputSelector, pinCode, { delay: 10 });
}

/**
 * Check if user is logged in
 * @param page The Puppeteer page to search for the selector and input the phone number
 */
export async function checkForElementToIndicateSuccessfulLogin(page: Page): Promise<boolean> {
  const cashBalanceSelector = "div[data-testid='total-balance-subheader']";
  try {
    await page.waitForSelector(cashBalanceSelector, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}
