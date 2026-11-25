const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateHostAccount = require("./corporateHostAccount");

class CorporateHostPaymentMethod extends Model {}

CorporateHostPaymentMethod.init(
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
    modelName: "CorporateHostPaymentMethod",
    tableName: "corporate_host_payment_methods",
    underscored: true,
    timestamps: true,
  }
);

// Associations
CorporateHostAccount.hasMany(CorporateHostPaymentMethod, { foreignKey: "corporate_host_id" });
CorporateHostPaymentMethod.belongsTo(CorporateHostAccount, { foreignKey: "corporate_host_id" });

module.exports = CorporateHostPaymentMethod;
