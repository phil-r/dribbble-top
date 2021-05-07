// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

module.exports = async function getTop() {
  const browser = await puppeteer.launch({
    // headless: false,
    // devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://dribbble.com/shots', {
    waitUntil: 'domcontentloaded',
  });

  const shots = await page.evaluate(() => {
    const results = [];
    const $shots = document.querySelectorAll('.shot-thumbnail');
    for (let i = 0; i < $shots.length; i++) {
      const id = parseInt($shots[i].dataset.screenshotId);
      const img = $shots[i].querySelector('figure img').src.split('&')[0];
      const video = $shots[i].querySelector('.video')?.dataset
        .videoTeaserXlarge;
      const url = $shots[i].querySelector('.dribbble-link').href;
      const likes = parseInt(
        $shots[i].querySelector('.js-shot-likes-count').innerText
      );
      // NOTE: comments were removed at some point
      const comments =
        parseInt(
          $shots[i].querySelector('.js-shot-comments-count')?.innerText
        ) || 0;
      // NOTE: views can be in format `99.9k`
      const viewsString = $shots[i].querySelector('.js-shot-views-count')
        ?.innerText;
      const title = $shots[i].querySelector('.shot-title').innerText;

      const authorName = $shots[i].querySelector(
        '.user-information .display-name'
      ).innerText;
      const authorURL = $shots[i].querySelector('.user-information .url').href;
      results.push({
        id,
        img,
        video,
        url,
        likes,
        comments,
        viewsString,
        title,
        author: {
          name: authorName,
          url: authorURL,
        },
      });
    }
    return Promise.resolve(results);
  });
  console.log(shots);
  await browser.close();
  return shots;
};
