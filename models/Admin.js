const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class Admin extends Model {}

Admin.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		admin_name: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		admin_email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		admin_job_title: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		admin_phone_number: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		role: {
			type: DataTypes.ENUM("super_admin"),
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
		modelName: "Admin",
		tableName: "admins",
		underscored: true,
		timestamps: true,
	}
);

module.exports = Admin;
