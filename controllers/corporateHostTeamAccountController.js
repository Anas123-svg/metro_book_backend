const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateHostTeamAccount = require("../models/corporateHostTeamAccounts");

const sanitizeTeamAccount = {
  attributes: { exclude: ["password"] },
};

exports.createTeamAccount = async (req, res) => {
  try {
    const corporateHostId = req.params.hostId || req.body.corporate_host_id;
    const { password, email, ...rest } = req.body;

    if (!corporateHostId) {
      return res.status(400).json({ error: "corporate_host_id is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const host = await CorporateHostAccount.findByPk(corporateHostId);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const hostEmail = String(host.admin_email || "").trim().toLowerCase();

    if (normalizedEmail === hostEmail) {
      return res.status(409).json({
        error: "Team account email cannot match the main host admin email",
      });
    }

    const existingTeamAccount = await CorporateHostTeamAccount.findOne({
      where: { email: { [Op.iLike]: normalizedEmail } },
    });
    if (existingTeamAccount) {
      return res.status(409).json({ error: "Team account email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const teamAccount = await CorporateHostTeamAccount.create({
      ...rest,
      email: normalizedEmail,
      corporate_host_id: corporateHostId,
      password: hashedPassword,
    });

    const response = await CorporateHostTeamAccount.findByPk(teamAccount.id, sanitizeTeamAccount);
    return res.status(201).json(response);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Team account email already exists" });
    }
    return res.status(500).json({ error: err.message });
  }
};

exports.getTeamAccountsByHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { page = 1, limit = 20, q, role, is_active } = req.query;

    const where = { corporate_host_id: hostId };
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

    const { rows, count } = await CorporateHostTeamAccount.findAndCountAll({
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
    const { page = 1, limit = 20, q, role, is_active, corporate_host_id } = req.query;
    const where = {};

    if (corporate_host_id) where.corporate_host_id = corporate_host_id;
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

    const { rows, count } = await CorporateHostTeamAccount.findAndCountAll({
      where,
      ...sanitizeTeamAccount,
      include: [{
        model: CorporateHostAccount,
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
    const teamAccount = await CorporateHostTeamAccount.findByPk(req.params.id, {
      ...sanitizeTeamAccount,
      include: [{
        model: CorporateHostAccount,
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
    const teamAccount = await CorporateHostTeamAccount.findByPk(req.params.id);
    if (!teamAccount) {
      return res.status(404).json({ error: "Team account not found" });
    }

    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await teamAccount.update(updates);

    const response = await CorporateHostTeamAccount.findByPk(teamAccount.id, sanitizeTeamAccount);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteTeamAccount = async (req, res) => {
  try {
    const teamAccount = await CorporateHostTeamAccount.findByPk(req.params.id);
    if (!teamAccount) {
      return res.status(404).json({ error: "Team account not found" });
    }

    await teamAccount.destroy();
    return res.json({ message: "Team account deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};