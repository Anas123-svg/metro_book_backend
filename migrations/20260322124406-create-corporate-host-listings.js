"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("corporate_host_listings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      corporate_host_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "corporate_host_accounts",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      corporate_host_customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "corporate_host_customers",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      is_corporate_owner_of_property: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      //step 2

      property_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      property_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      postal_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      room_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      longitude: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      latitude: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      //step 3

      area: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      guests: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      bedrooms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      bathrooms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      kitchen: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      beds: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      //step 4
      common_amenities: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      special_features: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      additional_features: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      safety_security_features: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      house_rules: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      additional_house_rules: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      property_tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },

      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      booking_availability: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "Always",
      },

      start_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cover_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      additional_images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      monthly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      price_per_night: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM("Available", "Booked"),
        defaultValue: "Available",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("corporate_host_listings");
  },
};
