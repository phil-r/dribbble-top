const polka = require('polka');
const send = require('@polka/send-type');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 });
const getTop = require('./drib');

const port = process.env.PORT || 8080;

const getCachedTop = async () => {
  let top = cache.get('top');
  if (!top) {
    top = await getTop();
    cache.set('top', top);
  }
  return top;
};

polka()
  .get('/', (req, res) => {
    return send(res, 200, 'hello!');
  })
  .get('/top', async (req, res) => {
    try {
      return send(res, 200, {
        top: await getCachedTop(),
        ok: true,
      });
    } catch (error) {
      return send(res, 500, {
        error: error.message,
        ok: false,
      });
    }
  })
  .listen(port, (err) => {
    if (err) throw err;
    console.log(`> Running on http://localhost:${port}`);
  });
