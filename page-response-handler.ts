import { EventEmitter } from 'events';
import { Page } from 'puppeteer';
import { TransactionsResponse } from './model.interface';

const oneUrls = ['https://partner-auth.one.app', 'https://api.one.app', 'https://auth.onefinance.com'];

export function collectPageResponses(page: Page, apiEventEmitter: EventEmitter) {
  page.on('response', async (response) => {
    // we only care about requests from these urls
    if (
      !oneUrls.some((url) => response.request().url().includes(url)) ||
      response.request().method().toUpperCase() === 'OPTIONS'
    ) {
      return;
    }

    let responseBody = (await response.text()) || undefined;

    const url = response.request().url();
    if (url.includes('https://api.one.app/banking/pockets?user_id=') && responseBody) {
      // console.log("emitting pockets event");
      apiEventEmitter.emit('pockets', responseBody);
    }

    if (
      url.includes('https://api.one.app/banking/pockets/pocket.') &&
      url.includes('transactions') &&
      responseBody &&
      responseBody.includes('"type":"NEXT"')
    ) {
      // console.log("emitting transactions event");
      apiEventEmitter.emit('transactions', responseBody);
      const body: TransactionsResponse = JSON.parse(responseBody);
      let next = body.next ?? '';
      const [baseUrl, urlParamsString] = response.request().url().split('?');
      const urlParams = new URLSearchParams(urlParamsString);
      urlParams.set('limit', '100');
      const headers = response.request().headers();

      while (next) {
        urlParams.set('next', next);
        const fetchResponse = await fetch(baseUrl + '?' + urlParams.toString(), { headers });
        const textBody = await fetchResponse.text();
        if (!fetchResponse.ok) {
          console.error('fetched response error', textBody);
          throw new Error(textBody);
        } else {
          console.log('fetched next page');
          const jsonBody: TransactionsResponse = JSON.parse(textBody);
          apiEventEmitter.emit('transactions', textBody);
          next = jsonBody.next ?? '';
        }
      }
    }
  });
}
