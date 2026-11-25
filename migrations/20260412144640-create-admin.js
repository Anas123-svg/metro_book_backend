"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admins", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable("admins");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_admins_role";'
    );
  },
};
