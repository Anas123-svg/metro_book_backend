
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("corporate_book_payment_methods", {
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

      payment_type: {
        type: Sequelize.ENUM("card", "bank_account"),
        allowNull: false,
      },

      provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      stripe_payment_method_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      card_brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      card_last4: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      expiry_month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      expiry_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      is_default: {
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
    await queryInterface.dropTable("corporate_book_payment_methods");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_corporate_book_payment_methods_payment_type";'
    );
  },
};
