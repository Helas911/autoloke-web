import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

async function scrapeAutoplius(query) {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });

    const url = `https://autoplius.lt/skelbimai/naudoti-automobiliai?search_text=${encodeURIComponent(query)}`;

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.announcement-item'));

      return cards.slice(0, 20).map((card) => {
        const title = card.querySelector('h3')?.textContent?.trim() || 'Skelbimas';
        const price = card.querySelector('.announcement-item-price')?.textContent?.trim() || '';
        const image = card.querySelector('img')?.getAttribute('src') || '';
        const href = card.querySelector('a')?.getAttribute('href') || '';

        return {
          source: 'Autoplius',
          title,
          priceText: price,
          imageUrl: image,
          url: href.startsWith('http') ? href : `https://autoplius.lt${href}`,
        };
      });
    });

    return items;
  } catch (e) {
    console.error('Autoplius scrape error', e);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAutogidas(query) {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });

    const url = `https://autogidas.lt/skelbimai/automobiliai/?keywords=${encodeURIComponent(query)}`;

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.list-item'));

      return cards.slice(0, 20).map((card) => {
        const title = card.querySelector('.item-title')?.textContent?.trim() || 'Skelbimas';
        const price = card.querySelector('.price')?.textContent?.trim() || '';
        const image = card.querySelector('img')?.getAttribute('src') || '';
        const href = card.querySelector('a')?.getAttribute('href') || '';

        return {
          source: 'Autogidas',
          title,
          priceText: price,
          imageUrl: image,
          url: href.startsWith('http') ? href : `https://autogidas.lt${href}`,
        };
      });
    });

    return items;
  } catch (e) {
    console.error('Autogidas scrape error', e);
    return [];
  } finally {
    await browser.close();
  }
}

app.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString();

  if (!q) {
    return res.json([]);
  }

  try {
    const [autoplius, autogidas] = await Promise.all([
      scrapeAutoplius(q),
      scrapeAutogidas(q),
    ]);

    const merged = [...autoplius, ...autogidas];

    res.json(merged);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Autoloke scraper server running on ${PORT}`);
});
