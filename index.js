const express = require("express");
const bodyParser = require("body-parser");

const app = express();
require("./swagger")(app);
const routes = require("./routes");
app.use(bodyParser.json());

// API Key Middleware
app.use((req, res, next) => {
  const apiKey = req.header("X-API-KEY");
  const secretKey = process.env.API_KEY;

  if (!apiKey) {
    res.status(403).json({ error: "No API key provided" });
  } else if (apiKey !== secretKey) {
    res.status(403).json({ error: "Invalid API key" });
  } else {
    next();
  }
});

// Use the routes middleware
app.use(routes);

// Get the port from environment variable or default to 3000
const port = process.env.PORT || 3000;

//Start the server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
