const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");

class User extends Model {}

User.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},

		user_name: {
			type: DataTypes.STRING,
			allowNull: true,
		},

		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},

		phone: {
			type: DataTypes.STRING,
			allowNull: true,
		},

		address: {
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

		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: "User",
		tableName: "users",
		underscored: true,
		timestamps: true,
	}
);

module.exports = User;

