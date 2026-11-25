'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('corporate_book_admin_accounts', 'is_email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn('corporate_book_admin_accounts', 'email_verification_code', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('corporate_book_admin_accounts', 'is_email_verified');
    await queryInterface.removeColumn('corporate_book_admin_accounts', 'email_verification_code');
  },
};