const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateHostPaymentMethod = require("../models/corporateHostPaymentMethod");
const CorporateHostTeamAccount = require("../models/corporateHostTeamAccounts");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmailVerificationCode } = require("../services/mailService");
require("dotenv").config();

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const mapHostProfileForTeam = (host, team) => {
  const profile = host.toJSON();
  profile.admin_email = team.email;
  profile.admin_name = team.name;
  profile.admin_job_title = team.job_title;
  profile.admin_phone_number = team.phone_number;
  profile.role = team.role;
  profile.is_active = team.is_active;
  return profile;
};
// -------------------- CORPORATE HOST ACCOUNT --------------------

// Create a new corporate host account
exports.createCorporateHost = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });
    if (!rest.admin_email) return res.status(400).json({ error: "admin_email is required" });

    const normalizedEmail = String(rest.admin_email).trim().toLowerCase();
    const verificationCode = generateVerificationCode();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create host
    const host = await CorporateHostAccount.create({
      ...rest,
      admin_email: normalizedEmail,
      is_email_verified: false,
      email_verification_code: verificationCode,
      password: hashedPassword,
    });

    await sendEmailVerificationCode({
      to: normalizedEmail,
      name: host.admin_name,
      code: verificationCode,
      accountType: "host",
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: host.id,
        email: host.admin_email,
        role: host.role,
        account_type: "host",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token valid for 1 hour
    );

    // Return host + token
    res.status(201).json({
      host: {
        id: host.id,
        company_name: host.company_name,
        admin_email: host.admin_email,
        role: host.role,
        is_email_verified: host.is_email_verified,
      },
      token,
      message: "Signup successful. Verification code sent to email.",
      ...(process.env.NODE_ENV !== "production" ? { verification_code: verificationCode } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a new verification code for host email verification
exports.sendCorporateHostVerificationCode = async (req, res) => {
  try {
    const { admin_email, email } = req.body;
    const targetEmail = String(admin_email || email || "").trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: "admin_email or email is required" });
    }

    const host = await CorporateHostAccount.findOne({ where: { admin_email: targetEmail } });
    if (!host) return res.status(404).json({ error: "Host not found" });

    if (host.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        is_email_verified: true,
      });
    }

    const verificationCode = generateVerificationCode();
    await host.update({ email_verification_code: verificationCode });

    await sendEmailVerificationCode({
      to: host.admin_email,
      name: host.admin_name,
      code: verificationCode,
      accountType: "host",
    });

    return res.status(200).json({
      message: "Verification code sent",
      ...(process.env.NODE_ENV !== "production" ? { verification_code: verificationCode } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Verify host email verification code
exports.verifyCorporateHostEmail = async (req, res) => {
  try {
    const { admin_email, email, code } = req.body;
    const targetEmail = String(admin_email || email || "").trim().toLowerCase();
    const inputCode = String(code || "").trim();

    if (!targetEmail || !inputCode) {
      return res.status(400).json({ error: "admin_email/email and code are required" });
    }

    const host = await CorporateHostAccount.findOne({ where: { admin_email: targetEmail } });
    if (!host) return res.status(404).json({ error: "Host not found" });

    if (host.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        host: {
          id: host.id,
          admin_email: host.admin_email,
          is_email_verified: host.is_email_verified,
        },
      });
    }

    if (!host.email_verification_code || host.email_verification_code !== inputCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await host.update({
      is_email_verified: true,
      email_verification_code: null,
    });

    return res.status(200).json({
      message: "Email verified successfully",
      host: {
        id: host.id,
        admin_email: host.admin_email,
        is_email_verified: host.is_email_verified,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Login corporate host account
exports.loginCorporateHost = async (req, res) => {
  try {
    const { admin_email, email, password } = req.body;
    const loginEmail = String(admin_email || email || "").trim().toLowerCase();

    if (!loginEmail || !password) {
      return res.status(400).json({ error: "admin_email and password are required" });
    }

    const host = await CorporateHostAccount.findOne({ where: { admin_email: loginEmail } });
    let teamAccount = null;
    let authenticatedHost = host;

    if (host) {
      const isPasswordValid = await bcrypt.compare(password, host.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });
    } else {
      teamAccount = await CorporateHostTeamAccount.findOne({ where: { email: loginEmail } });
      if (!teamAccount) return res.status(401).json({ error: "Invalid credentials" });

      const isPasswordValid = await bcrypt.compare(password, teamAccount.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

      authenticatedHost = await CorporateHostAccount.findByPk(teamAccount.corporate_host_id);
      if (!authenticatedHost) return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      teamAccount
        ? {
            id: authenticatedHost.id,
            email: teamAccount.email,
            role: teamAccount.role,
            account_type: "team",
            team_account_id: teamAccount.id,
          }
        : {
            id: authenticatedHost.id,
            email: authenticatedHost.admin_email,
            role: authenticatedHost.role,
            account_type: "host",
          },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Keep the same response shape as createCorporateHost
    res.status(200).json({
      host: {
        id: authenticatedHost.id,
        company_name: authenticatedHost.company_name,
        admin_email: teamAccount ? teamAccount.email : authenticatedHost.admin_email,
        role: teamAccount ? teamAccount.role : authenticatedHost.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current corporate host details from token
exports.getCorporateHostProfile = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: CorporateHostPaymentMethod,
    });

    if (!host) return res.status(404).json({ error: "Host not found" });

    if (req.user.account_type === "team" && req.user.team_account_id) {
      const teamAccount = await CorporateHostTeamAccount.findByPk(req.user.team_account_id, {
        attributes: ["id", "name", "email", "job_title", "phone_number", "role", "is_active"],
      });

      if (!teamAccount) {
        return res.status(404).json({ error: "Team account not found" });
      }

      return res.json(mapHostProfileForTeam(host, teamAccount));
    }

    return res.json(host);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
// Get all corporate hosts with their payment methods
exports.getAllCorporateHosts = async (req, res) => {
  try {
    const hosts = await CorporateHostAccount.findAll({
      include: CorporateHostPaymentMethod,
    });
    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single corporate host by ID with payment methods
exports.getCorporateHostById = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.params.id, {
      include: CorporateHostPaymentMethod,
    });

    if (!host) return res.status(404).json({ error: "Host not found" });

    res.json(host);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a corporate host account
exports.updateCorporateHost = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.params.id);
    if (!host) return res.status(404).json({ error: "Host not found" });

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    await host.update(req.body);
    res.json(host);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a corporate host account
exports.deleteCorporateHost = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.params.id);
    if (!host) return res.status(404).json({ error: "Host not found" });

    await host.destroy();
    res.json({ message: "Host deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- PAYMENT METHODS --------------------

// Add a payment method to a host
exports.addPaymentMethod = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.body.corporate_host_id);
    if (!host) return res.status(404).json({ error: "Host not found" });

    const paymentMethod = await CorporateHostPaymentMethod.create(req.body);
    res.status(201).json(paymentMethod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payment methods of a host
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await CorporateHostPaymentMethod.findAll({
      where: { corporate_host_id: req.params.id },
    });
    res.json(paymentMethods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const method = await CorporateHostPaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: "Payment method not found" });

    await method.update(req.body);
    res.json(method);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await CorporateHostPaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: "Payment method not found" });

    await method.destroy();
    res.json({ message: "Payment method deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
