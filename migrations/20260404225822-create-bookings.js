"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      corporate_book_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "corporate_book_admin_accounts",
          key: "id",
        },
        onDelete: "CASCADE",
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

      corporate_book_cusomter_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "corporate_book_customers",
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


      is_corporate_host_owner_of_property: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      is_corporate_book_customer: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      listing_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "corporate_host_listings",
          key: "id",
        },
        onDelete: "CASCADE",
      },


      property_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      check_in_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      check_out_date: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      guests: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      check_in_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      check_out_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      special_notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      total_days: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      total_amount: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      
 
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      payment_status: {
        type: Sequelize.ENUM("paid", "pending", "refunded"),
        defaultValue: "paid",
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: "confirmed",
      },

      terms_Conditions: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable("bookings");

  },
};
