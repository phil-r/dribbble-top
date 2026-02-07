import { getConfig } from "../config";
import { getTop } from "../scraper";

const config = getConfig();

const top = await getTop({
  disableSandbox: config.puppeteerDisableSandbox,
  headless: config.puppeteerHeadless,
  executablePath: config.puppeteerExecutablePath,
});

console.log(top);
