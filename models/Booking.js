const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateBookAdminAccount = require("./corporateBookAdminAccount");
const CorporateHostAccount = require("./corporateHostAccount");
const CorporateBookCustomerAccount = require("./corporateBookCustomerAccounts");
const CorporateHostCustomerAccount = require("./corporateHostCustomerAccounts");
const CorporateHostListing = require("./corporateHostListing");
const User = require("./User");

class Booking extends Model {}

Booking.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		customer_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		corporate_book_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		corporate_host_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		corporate_book_customer_id: {
			type: DataTypes.UUID,
			allowNull: true,
			field: "corporate_book_cusomter_id",
		},
		corporate_host_customer_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		is_corporate_host_owner_of_property: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		is_corporate_book_customer: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		listing_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		property_name: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		check_in_date: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		check_out_date: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		guests: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		check_in_time: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		check_out_time: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		special_notes: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		total_days: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		total_amount: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		payment_status: {
			type: DataTypes.ENUM("paid", "pending", "refunded"),
			defaultValue: "paid",
		},
		status: {
			type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
			defaultValue: "confirmed",
		},
		terms_Conditions: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "terms_Conditions",
		},
	},
	{
		sequelize,
		modelName: "Booking",
		tableName: "bookings",
		underscored: true,
		timestamps: true,
	}
);

Booking.belongsTo(CorporateBookAdminAccount, {
	foreignKey: "corporate_book_id",
	as: "book",
});
Booking.belongsTo(User, {
	foreignKey: "customer_id",
	as: "customer",
});
Booking.belongsTo(CorporateHostAccount, {
	foreignKey: "corporate_host_id",
	as: "host",
});

Booking.belongsTo(CorporateBookCustomerAccount, {
	foreignKey: "corporate_book_customer_id",
	as: "book_customer",
});

Booking.belongsTo(CorporateHostCustomerAccount, {
	foreignKey: "corporate_host_customer_id",
	as: "host_customer",
});

Booking.belongsTo(CorporateHostListing, {
	foreignKey: "listing_id",
	as: "listing",
});

CorporateBookAdminAccount.hasMany(Booking, {
	foreignKey: "corporate_book_id",
	as: "bookings",
});

CorporateHostAccount.hasMany(Booking, {
	foreignKey: "corporate_host_id",
	as: "bookings",
});

CorporateBookCustomerAccount.hasMany(Booking, {
	foreignKey: "corporate_book_customer_id",
	as: "bookings",
});

CorporateHostCustomerAccount.hasMany(Booking, {
	foreignKey: "corporate_host_customer_id",
	as: "bookings",
});

CorporateHostListing.hasMany(Booking, {
	foreignKey: "listing_id",
	as: "bookings",
});

module.exports = Booking;
