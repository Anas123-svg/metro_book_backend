"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("corporate_host_accounts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      company_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      business_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      registration_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      tax_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      admin_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      admin_email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      admin_job_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      admin_phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      role: {
        type: Sequelize.ENUM("super_admin"),
        defaultValue: "super_admin",
      },

      kyb_status: {
        type: Sequelize.ENUM("pending", "submitted", "approved", "rejected"),
        defaultValue: "pending",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable("corporate_host_accounts");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_corporate_host_accounts_role";'
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_corporate_host_accounts_kyb_status";'
    );
  },
};
