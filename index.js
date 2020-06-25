const polka = require('polka');
const send = require('@polka/send-type');

const getTop = require('./drib');

const port = process.env.PORT || 8080;

polka()
  .get('/', (req, res) => {
    return send(res, 200, 'hello!');
  })
  .get('/top', async (req, res) => {
    return send(res, 200, {
      top: await getTop(),
    });
  })
  .listen(port, (err) => {
    if (err) throw err;
    console.log(`> Running on http://localhost:${port}`);
  });
