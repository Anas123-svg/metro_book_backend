const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateBookAdminAccount = require("./corporateBookAdminAccount");

class CorporateBookPaymentMethod extends Model {}

CorporateBookPaymentMethod.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    payment_type: { type: DataTypes.ENUM("card", "bank_account"), allowNull: false },
    stripe_customer_id: DataTypes.STRING,
    stripe_payment_method_id: DataTypes.STRING,
    card_brand: DataTypes.STRING,
    card_last4: DataTypes.STRING,
    expiry_month: DataTypes.INTEGER,
    expiry_year: DataTypes.INTEGER,
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "CorporateBookPaymentMethod",
    tableName: "corporate_book_payment_methods",
    underscored: true,
    timestamps: true,
  }
);

// Associations
CorporateBookAdminAccount.hasMany(CorporateBookPaymentMethod, { foreignKey: "corporate_book_id" });
CorporateBookPaymentMethod.belongsTo(CorporateBookAdminAccount, { foreignKey: "corporate_book_id" });

module.exports = CorporateBookPaymentMethod;
