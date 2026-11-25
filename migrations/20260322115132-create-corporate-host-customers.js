"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("corporate_host_customers", {
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


      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      address: {
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

      zipcode: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      country: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },

 

      kyc_status: {
        type: Sequelize.ENUM("pending", "submitted", "approved", "rejected"),
        defaultValue: "pending",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      email_verification_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      terms_Conditions: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable("corporate_host_customers");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_corporate_host_customers_kyc_status";'
    );
  },
};
