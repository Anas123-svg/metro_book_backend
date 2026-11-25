const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateHostAccount = require("./corporateHostAccount");

class CorporateHostTeamAccount extends Model {}

CorporateHostTeamAccount.init(
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
		modelName: "CorporateHostTeamAccount",
		tableName: "corporate_host_team_accounts",
		underscored: true,
		timestamps: true,
	}
);

// Associations
CorporateHostAccount.hasMany(CorporateHostTeamAccount, { foreignKey: "corporate_host_id" });
CorporateHostTeamAccount.belongsTo(CorporateHostAccount, { foreignKey: "corporate_host_id" });

module.exports = CorporateHostTeamAccount;
