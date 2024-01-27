import { Page } from "puppeteer";

const oneUrls = [
  "https://partner-auth.one.app",
  "https://api.one.app",
  "https://auth.onefinance.com",
];

export async function collectPageRequests(page: Page, url: string) {
  const results: any[] = []; // collects all results

  let paused = false;
  let pausedRequests: any[] = [];

  const nextRequest = () => {
    // continue the next request or "unpause"
    if (pausedRequests.length === 0) {
      paused = false;
    } else {
      // continue first request in "queue"
      pausedRequests.shift()(); // calls the request.continue function
    }
  };

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    // we only care about requests from these urls
    if (!oneUrls.some((url) => request.url().includes(url))) {
      return request.continue();
    }

    if (paused) {
      pausedRequests.push(() => request.continue());
    } else {
      paused = true; // pause, as we are processing a request now
      request.continue();
    }
  });

  page.on("requestfinished", async (request) => {
    // we only care about requests from these urls
    if (!oneUrls.some((url) => request.url().includes(url))) {
      return nextRequest();
    }

    const response = request.response();

    const responseHeaders = response?.headers() || {};
    let responseBody: Buffer | undefined;
    if (request.redirectChain().length === 0) {
      // body can only be access for non-redirect responses
      responseBody = await response?.buffer();
    }

    const information = {
      url: request.url(),
      requestHeaders: request.headers(),
      requestPostData: request.postData(),
      responseHeaders: responseHeaders,
      responseSize: responseHeaders["content-length"],
      responseBody,
    };
    results.push(information);

    nextRequest(); // continue with next request
  });

  page.on("requestfailed", (request) => {
    // handle failed request
    nextRequest();
  });

  await page.goto(url, { waitUntil: "networkidle0" });
  console.log(results);
}
