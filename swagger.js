const swaggerUI = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

let options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OpenCBDC Wallet Proxy API",
      version: "1.0.0",
      description:
        "a wrapper proxy around the client-cli wallet for the OpenCBDC",
    },
    servers: [],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-KEY",
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ["routes.js"],
};

module.exports = (app) => {
  app.use((req, res, next) => {
    options.definition.servers = [
      {
        url: `${req.protocol}://${req.get("host")}`,
      },
    ];
    next();
  });

  app.use("/api-docs", swaggerUI.serve, (req, res, next) => {
    const specs = swaggerJsdoc(options);
    swaggerUI.setup(specs)(req, res, next);
  });
};
