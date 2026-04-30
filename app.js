// Phusion Passenger entry point for Hostinger's Node.js hosting.
// Passenger sets process.env.PORT and supervises the process; we just boot
// the same Next.js server that `next start` would.

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false, hostname: "0.0.0.0", port });
const handler = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handler(req, res)).listen(port, () => {
      console.log(`> dwp ready on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Next.js failed to start:", err);
    process.exit(1);
  });
