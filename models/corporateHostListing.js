const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db");
const CorporateHostAccount = require("./corporateHostAccount");
const CorporateHostCustomerAccount = require("./corporateHostCustomerAccounts");

class CorporateHostListing extends Model {}

CorporateHostListing.init(
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
		corporate_host_customer_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		is_corporate_owner_of_property: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		property_type: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		property_name: {
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
		postal_code: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		room_no: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		longitude: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		latitude: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		area: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		guests: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		bedrooms: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		bathrooms: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		kitchen: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		beds: {
			type: DataTypes.BIGINT,
			allowNull: true,
		},
		common_amenities: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		special_features: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		additional_features: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		safety_security_features: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		house_rules: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		additional_house_rules: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		property_tags: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		booking_availability: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: "Always",
		},
		start_date: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		end_date: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		cover_image: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		additional_images: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		monthly_price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
		},
		price_per_night: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
        status: {
          type: DataTypes.ENUM("Available","Booked"),
          defaultValue: "Available",
        },
	},
	{
		sequelize,
		modelName: "CorporateHostListing",
		tableName: "corporate_host_listings",
		underscored: true,
		timestamps: true,
	}
);

// Associations
CorporateHostAccount.hasMany(CorporateHostListing, {
	foreignKey: "corporate_host_id",
	as: "listings",
});
CorporateHostListing.belongsTo(CorporateHostAccount, {
	foreignKey: "corporate_host_id",
	as: "host",
});

CorporateHostCustomerAccount.hasMany(CorporateHostListing, {
	foreignKey: "corporate_host_customer_id",
	as: "listings",
});
CorporateHostListing.belongsTo(CorporateHostCustomerAccount, {
	foreignKey: "corporate_host_customer_id",
	as: "customer",
});

module.exports = CorporateHostListing;
