const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateBookAdminAccount = require("./corporateBookAdminAccount");

class CorporateBookTeamAccount extends Model {}

CorporateBookTeamAccount.init(
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
			allowNull: false,
			unique: true,
		},
		job_title: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		phone_number: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		profile_pic: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		role: {
			type: DataTypes.STRING,
			defaultValue: "super_admin",
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: "CorporateBookTeamAccount",
		tableName: "corporate_book_team_accounts",
		underscored: true,
		timestamps: true,
	}
);

// Associations
CorporateBookAdminAccount.hasMany(CorporateBookTeamAccount, { foreignKey: "corporate_book_id" });
CorporateBookTeamAccount.belongsTo(CorporateBookAdminAccount, { foreignKey: "corporate_book_id" });

module.exports = CorporateBookTeamAccount;
