const { Sequelize } = require("sequelize");
const options = require("./databaseOptions");

const sequelize = new Sequelize(options);

const connectDB = async () => {
  await sequelize.authenticate();
  console.log("Sequelize connected to PostgreSQL");
};

module.exports = { sequelize, connectDB };
