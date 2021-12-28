import polka from "polka";
import send from "@polka/send-type";
import mem from "mem";

import { getTop } from "./drib.js";

const memTop = mem(getTop, { maxAge: 10 * 60 * 1000 });

const port = process.env.PORT || 8080;

polka()
  .get("/", (req, res) => {
    return send(res, 200, "hello!");
  })
  .get("/top", async (req, res) => {
    try {
      return send(res, 200, {
        top: await memTop(),
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
