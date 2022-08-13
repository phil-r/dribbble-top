// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
import puppeteer from 'puppeteer-extra';

// Add stealth plugin
import pluginStealth from 'puppeteer-extra-plugin-stealth';
const ps = pluginStealth();
// Remove specific evasion from enabled ones dynamically due to https://github.com/berstend/puppeteer-extra/issues/467
ps.enabledEvasions.delete('user-agent-override');
puppeteer.use(ps);

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export async function getTop() {
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

  // dribbble lazily loads images that are in the view, so we need to scroll
  await page.evaluate(()=>{
    window.scrollBy(0, document.body.scrollHeight);
  });

  const shots = await page.evaluate(async () => {
    const results = [];
    let fails = 0;
    const $shots = document.querySelectorAll('.shot-thumbnail');
    for (let i = 0; i < $shots.length; i++) {
      $shots[i].scrollIntoView();
      const id = parseInt($shots[i].dataset.thumbnailId);
      const img = $shots[i].querySelector('figure img').src.split('&')[0];
      if (img.startsWith('data:image/gif;base64')) {
        if (fails > 10) {
          fails = 0;
          continue;
        }
        fails++;
        i--;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
      const video = $shots[i].querySelector('.video')?.dataset
        .videoTeaserLarge;
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
    return results;
  });
  console.log(shots);
  await browser.close();
  return shots;
};
