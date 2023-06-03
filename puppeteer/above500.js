import puppeteer from "puppeteer-core";

const delay = (msec) => new Promise((r) => setTimeout(r, msec));

const scraper = (league) => {
  const filename = `${league.at(0)}Labove500.png`;
  document.dispatchEvent(new CustomEvent("PngDownload", {
    detail: {
      self: document.querySelector("npb-above500"),
      league,
      filename,
    }
  }));
};

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1300,
      height: 1300,
    },
    executablePath: "/usr/bin/chromium",
    headless: "new",
  });

  const page = await browser.newPage();
  const cdpSession = await page.target().createCDPSession();
  await cdpSession.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: ".",
    eventsEnabled: true,
  });

  const targetURL = `https://kurimareiji.github.io/npb2023/above500/Central`;
  await page.goto(targetURL);
  console.log("Hello");
  await page.waitForSelector(`npb-above500[league]`);
  await page.evaluate(scraper, "Central");
  console.log("Download Central");
  await delay(1500);
  await page.evaluate(scraper, "Pacific");
  console.log("Download Pacific");
  await delay(1500);

  await browser.close();

})();
