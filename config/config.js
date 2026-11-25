const options = require("./databaseOptions");
module.exports = {
  development: { ...options },
  test: { ...options },
  production: { ...options },
};
