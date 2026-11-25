const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateHostAccount = require("./corporateHostAccount");

class CorporateHostCustomerAccount extends Model {}

CorporateHostCustomerAccount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    corporate_host_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kyc_status: {
      type: DataTypes.ENUM("pending", "submitted", "approved", "rejected"),
      defaultValue: "pending",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    terms_Conditions: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "terms_Conditions",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "CorporateHostCustomerAccount",
    tableName: "corporate_host_customers",
    underscored: true,
    timestamps: true,
  }
);

// Associations
CorporateHostAccount.hasMany(CorporateHostCustomerAccount, {
  foreignKey: "corporate_host_id",
  as: "customers",
});
CorporateHostCustomerAccount.belongsTo(CorporateHostAccount, {
  foreignKey: "corporate_host_id",
  as: "host",
});

module.exports = CorporateHostCustomerAccount;
