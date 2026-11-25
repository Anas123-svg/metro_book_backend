'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("corporate_book_team_accounts", {
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


      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      job_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      profile_pic: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      role: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("corporate_book_team_accounts");

  },
};
