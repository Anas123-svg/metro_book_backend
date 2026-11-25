const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const CorporateBookAdminAccount = require("../models/corporateBookAdminAccount");
const CorporateBookTeamAccount = require("../models/corporateBookTeamAccounts");

const sanitizeTeamAccount = {
  attributes: { exclude: ["password"] },
};

exports.createTeamAccount = async (req, res) => {
  try {
    const corporateBookId = req.params.bookId || req.body.corporate_book_id;
    const { password, email, ...rest } = req.body;

    if (!corporateBookId) {
      return res.status(400).json({ error: "corporate_book_id is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const book = await CorporateBookAdminAccount.findByPk(corporateBookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const bookEmail = String(book.admin_email || "").trim().toLowerCase();

    if (normalizedEmail === bookEmail) {
      return res.status(409).json({
        error: "Team account email cannot match the main book admin email",
      });
    }

    const existingTeamAccount = await CorporateBookTeamAccount.findOne({
      where: { email: { [Op.iLike]: normalizedEmail } },
    });
    if (existingTeamAccount) {
      return res.status(409).json({ error: "Team account email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const teamAccount = await CorporateBookTeamAccount.create({
      ...rest,
      email: normalizedEmail,
      corporate_book_id: corporateBookId,
      password: hashedPassword,
    });

    const response = await CorporateBookTeamAccount.findByPk(teamAccount.id, sanitizeTeamAccount);
    return res.status(201).json(response);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Team account email already exists" });
    }
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamAccountsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 20, q, role, is_active } = req.query;

    const where = { corporate_book_id: bookId };
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { job_title: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (role) where.role = role;
    if (typeof is_active !== "undefined") {
      where.is_active = String(is_active).toLowerCase() === "true";
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, count } = await CorporateBookTeamAccount.findAndCountAll({
      where,
      ...sanitizeTeamAccount,
      limit: parsedLimit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.indexTeamAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, role, is_active, corporate_book_id } = req.query;
    const where = {};

    if (corporate_book_id) where.corporate_book_id = corporate_book_id;
    if (role) where.role = role;
    if (typeof is_active !== "undefined") {
      where.is_active = String(is_active).toLowerCase() === "true";
    }
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { job_title: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, count } = await CorporateBookTeamAccount.findAndCountAll({
      where,
      ...sanitizeTeamAccount,
      include: [{
        model: CorporateBookAdminAccount,
        attributes: ["id", "company_name", "admin_email"],
      }],
      limit: parsedLimit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      data: rows,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamAccountById = async (req, res) => {
  try {
    const teamAccount = await CorporateBookTeamAccount.findByPk(req.params.id, {
      ...sanitizeTeamAccount,
      include: [{
        model: CorporateBookAdminAccount,
        attributes: ["id", "company_name", "admin_email"],
      }],
    });

    if (!teamAccount) {
      return res.status(404).json({ error: "Team account not found" });
    }

    return res.json(teamAccount);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTeamAccount = async (req, res) => {
  try {
    const teamAccount = await CorporateBookTeamAccount.findByPk(req.params.id);
    if (!teamAccount) {
      return res.status(404).json({ error: "Team account not found" });
    }

    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await teamAccount.update(updates);

    const response = await CorporateBookTeamAccount.findByPk(teamAccount.id, sanitizeTeamAccount);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteTeamAccount = async (req, res) => {
  try {
    const teamAccount = await CorporateBookTeamAccount.findByPk(req.params.id);
    if (!teamAccount) {
      return res.status(404).json({ error: "Team account not found" });
    }

    await teamAccount.destroy();
    return res.json({ message: "Team account deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};