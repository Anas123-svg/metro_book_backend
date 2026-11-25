const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateBookAdminAccount = require("./corporateBookAdminAccount");

class CorporateBookCustomerAccount extends Model {}

CorporateBookCustomerAccount.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		corporate_book_id: {
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
		modelName: "CorporateBookCustomerAccount",
		tableName: "corporate_book_customers",
		underscored: true,
		timestamps: true,
	}
);

// Associations
CorporateBookAdminAccount.hasMany(CorporateBookCustomerAccount, {
	foreignKey: "corporate_book_id",
	as: "customers",
});
CorporateBookCustomerAccount.belongsTo(CorporateBookAdminAccount, {
	foreignKey: "corporate_book_id",
	as: "book",
});

module.exports = CorporateBookCustomerAccount;
