const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class CorporateBookAdminAccount extends Model {}

CorporateBookAdminAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    company_name: DataTypes.STRING,
    business_address: DataTypes.STRING,
    registration_number: DataTypes.STRING,
    tax_id: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    admin_name: DataTypes.STRING,
    admin_email: { type: DataTypes.STRING, allowNull: false, unique: true },
    admin_job_title: DataTypes.STRING,
    admin_phone_number: DataTypes.STRING,
    is_email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    email_verification_code: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM("super_admin"), defaultValue: "super_admin" },
    kyb_status: {
      type: DataTypes.ENUM("pending", "submitted", "approved", "rejected"),
      defaultValue: "pending",
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    terms_Conditions: { type: DataTypes.BOOLEAN, defaultValue: false, field: "terms_Conditions" },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: "CorporateBookAdminAccount",
    tableName: "corporate_book_admin_accounts",
    underscored: true,
    timestamps: true,
  }
);

module.exports = CorporateBookAdminAccount;
