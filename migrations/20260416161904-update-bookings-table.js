"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Make corporate_book_id nullable (explicitly)
    await queryInterface.changeColumn("bookings", "corporate_book_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // (Optional but safer) Re-add FK constraint explicitly
    await queryInterface.addConstraint("bookings", {
      fields: ["corporate_book_id"],
      type: "foreign key",
      name: "fk_bookings_corporate_book_id",
      references: {
        table: "corporate_book_admin_accounts",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // 2. Add customer_id column with FK
    await queryInterface.addColumn("bookings", "customer_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addConstraint("bookings", {
      fields: ["customer_id"],
      type: "foreign key",
      name: "fk_bookings_customer_id",
      references: {
        table: "users",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove constraints first
    await queryInterface.removeConstraint("bookings", "fk_bookings_customer_id");
    await queryInterface.removeConstraint("bookings", "fk_bookings_corporate_book_id");

    // Remove customer_id column
    await queryInterface.removeColumn("bookings", "customer_id");

    // Revert corporate_book_id to NOT NULL
    await queryInterface.changeColumn("bookings", "corporate_book_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });

    // Re-add FK constraint
    await queryInterface.addConstraint("bookings", {
      fields: ["corporate_book_id"],
      type: "foreign key",
      name: "fk_bookings_corporate_book_id",
      references: {
        table: "corporate_book_admin_accounts",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};