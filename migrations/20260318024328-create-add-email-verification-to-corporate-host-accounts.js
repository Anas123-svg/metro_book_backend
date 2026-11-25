"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add is_email_verified column
    await queryInterface.addColumn("corporate_host_accounts", "is_email_verified", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    // Add email_verification_code column
    await queryInterface.addColumn("corporate_host_accounts", "email_verification_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns (rollback)
    await queryInterface.removeColumn("corporate_host_accounts", "is_email_verified");
    await queryInterface.removeColumn("corporate_host_accounts", "email_verification_code");
  },
};