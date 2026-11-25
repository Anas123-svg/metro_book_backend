const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateHostCustomerAccount = require("../models/corporateHostCustomerAccounts");
const { sendEmailVerificationCode } = require("../services/mailService");
require("dotenv").config();

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Create a new customer account for a corporate host
exports.createCustomerAccount = async (req, res) => {
  try {
    const { corporate_host_id, password, ...rest } = req.body;

    if (!corporate_host_id) {
      return res.status(400).json({ error: "corporate_host_id is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (!rest.email) {
      return res.status(400).json({ error: "email is required" });
    }

    const host = await CorporateHostAccount.findByPk(corporate_host_id);
    if (!host) {
      return res.status(404).json({ error: "Corporate host not found" });
    }

    const normalizedEmail = String(rest.email).trim().toLowerCase();
    const existingCustomer = await CorporateHostCustomerAccount.findOne({
      where: { email: normalizedEmail, corporate_host_id },
    });
    if (existingCustomer) {
      return res.status(409).json({ error: "Customer email already exists for this host" });
    }

    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await CorporateHostCustomerAccount.create({
      ...rest,
      corporate_host_id,
      email: normalizedEmail,
      password: hashedPassword,
      is_email_verified: false,
      email_verification_code: verificationCode,
    });

    // await sendEmailVerificationCode({
    //   to: normalizedEmail,
    //   name: customer.name,
    //   code: verificationCode,
    //   accountType: "host",
    // });

    return res.status(201).json({
      customer: {
        id: customer.id,
        corporate_host_id: customer.corporate_host_id,
        name: customer.name,
        email: customer.email,
        is_email_verified: customer.is_email_verified,
      },
      message: "Customer account created. Verification code sent to email.",
      ...(process.env.NODE_ENV !== "production" ? { verification_code: verificationCode } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Send a new verification code for customer email verification
exports.sendCustomerVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = String(email || "").trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: "email is required" });
    }

    const customer = await CorporateHostCustomerAccount.findOne({
      where: { email: targetEmail },
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (customer.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        is_email_verified: true,
      });
    }

    const verificationCode = generateVerificationCode();
    await customer.update({ email_verification_code: verificationCode });

    await sendEmailVerificationCode({
      to: customer.email,
      name: customer.name,
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

// Verify customer email verification code
exports.verifyCustomerEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const targetEmail = String(email || "").trim().toLowerCase();
    const inputCode = String(code || "").trim();

    if (!targetEmail || !inputCode) {
      return res.status(400).json({ error: "email and code are required" });
    }

    const customer = await CorporateHostCustomerAccount.findOne({
      where: { email: targetEmail },
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (customer.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        customer: {
          id: customer.id,
          email: customer.email,
          is_email_verified: customer.is_email_verified,
        },
      });
    }

    if (!customer.email_verification_code || customer.email_verification_code !== inputCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await customer.update({
      is_email_verified: true,
      email_verification_code: null,
    });

    return res.status(200).json({
      message: "Email verified successfully",
      customer: {
        id: customer.id,
        email: customer.email,
        is_email_verified: customer.is_email_verified,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Login customer account
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginEmail = String(email || "").trim().toLowerCase();

    if (!loginEmail || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const customer = await CorporateHostCustomerAccount.findOne({
      where: { email: loginEmail },
    });
    if (!customer) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        role: "customer",
        account_type: "customer",
        corporate_host_id: customer.corporate_host_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      customer: {
        id: customer.id,
        corporate_host_id: customer.corporate_host_id,
        name: customer.name,
        email: customer.email,
        role: "customer",
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get current customer details from token
exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await CorporateHostCustomerAccount.findByPk(req.user.id, {
      attributes: { exclude: ["password", "email_verification_code"] },
      include: {
        model: CorporateHostAccount,
        as: "host",
        attributes: ["id", "company_name", "admin_email", "is_active"],
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.json(customer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await CorporateHostCustomerAccount.findAll({
      attributes: { exclude: ["password", "email_verification_code"] },
      include: {
        model: CorporateHostAccount,
        as: "host",
        attributes: ["id", "company_name", "admin_email"],
      },
      order: [["created_at", "DESC"]],
    });
    return res.json(customers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await CorporateHostCustomerAccount.findByPk(req.params.id, {
      attributes: { exclude: ["password", "email_verification_code"] },
      include: {
        model: CorporateHostAccount,
        as: "host",
        attributes: ["id", "company_name", "admin_email"],
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.json(customer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all customers of a host
exports.getCustomersByHost = async (req, res) => {
  try {
    const host = await CorporateHostAccount.findByPk(req.params.hostId);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const customers = await CorporateHostCustomerAccount.findAll({
      where: { corporate_host_id: req.params.hostId },
      attributes: { exclude: ["password", "email_verification_code"] },
      order: [["created_at", "DESC"]],
    });

    return res.json(customers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update a customer account
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await CorporateHostCustomerAccount.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    if (payload.email) {
      payload.email = String(payload.email).trim().toLowerCase();
    }

    await customer.update(payload);

    const updated = await CorporateHostCustomerAccount.findByPk(customer.id, {
      attributes: { exclude: ["password", "email_verification_code"] },
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete a customer account
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await CorporateHostCustomerAccount.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await customer.destroy();
    return res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
