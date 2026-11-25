const { Op } = require("sequelize");
const CorporateBookAdminAccount = require("../models/corporateBookAdminAccount");
const CorporateBookPaymentMethod = require("../models/corporateBookPaymentMethod");
const CorporateBookTeamAccount = require("../models/corporateBookTeamAccounts");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmailVerificationCode } = require("../services/mailService");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const getStripeConfigError = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return "Stripe is not configured. Missing STRIPE_SECRET_KEY";
  }

  if (!String(stripeKey).startsWith("sk_")) {
    return "Invalid STRIPE_SECRET_KEY. Server must use a secret key starting with sk_ (not pk_)";
  }

  return null;
};

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const mapBookProfileForTeam = (book, team) => {
  const profile = book.toJSON();
  profile.admin_email = team.email;
  profile.admin_name = team.name;
  profile.admin_job_title = team.job_title;
  profile.admin_phone_number = team.phone_number;
  profile.role = team.role;
  profile.is_active = team.is_active;
  return profile;
};

// -------------------- CORPORATE BOOK ACCOUNT --------------------

// Create a new corporate book account
exports.createCorporateBook = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });
    if (!rest.admin_email) return res.status(400).json({ error: "admin_email is required" });

    const normalizedEmail = String(rest.admin_email).trim().toLowerCase();
    const verificationCode = generateVerificationCode();

    const hashedPassword = await bcrypt.hash(password, 10);

    const book = await CorporateBookAdminAccount.create({
      ...rest,
      admin_email: normalizedEmail,
      is_email_verified: false,
      email_verification_code: verificationCode,
      password: hashedPassword,
    });

    await sendEmailVerificationCode({
      to: normalizedEmail,
      name: book.admin_name,
      code: verificationCode,
      accountType: "book",
    });

    const token = jwt.sign(
      {
        id: book.id,
        email: book.admin_email,
        role: book.role,
        account_type: "book",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      book: {
        id: book.id,
        company_name: book.company_name,
        admin_email: book.admin_email,
        role: book.role,
        is_email_verified: book.is_email_verified,
      },
      token,
      message: "Signup successful. Verification code sent to email.",
      ...(process.env.NODE_ENV !== "production" ? { verification_code: verificationCode } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a new verification code for book email verification
exports.sendCorporateBookVerificationCode = async (req, res) => {
  try {
    const { admin_email, email } = req.body;
    const targetEmail = String(admin_email || email || "").trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: "admin_email or email is required" });
    }

    const book = await CorporateBookAdminAccount.findOne({ where: { admin_email: targetEmail } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (book.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        is_email_verified: true,
      });
    }

    const verificationCode = generateVerificationCode();
    await book.update({ email_verification_code: verificationCode });

    await sendEmailVerificationCode({
      to: book.admin_email,
      name: book.admin_name,
      code: verificationCode,
      accountType: "book",
    });

    return res.status(200).json({
      message: "Verification code sent",
      ...(process.env.NODE_ENV !== "production" ? { verification_code: verificationCode } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Verify book email verification code
exports.verifyCorporateBookEmail = async (req, res) => {
  try {
    const { admin_email, email, code } = req.body;
    const targetEmail = String(admin_email || email || "").trim().toLowerCase();
    const inputCode = String(code || "").trim();

    if (!targetEmail || !inputCode) {
      return res.status(400).json({ error: "admin_email/email and code are required" });
    }

    const book = await CorporateBookAdminAccount.findOne({ where: { admin_email: targetEmail } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (book.is_email_verified) {
      return res.status(200).json({
        message: "Email is already verified",
        book: {
          id: book.id,
          admin_email: book.admin_email,
          is_email_verified: book.is_email_verified,
        },
      });
    }

    if (!book.email_verification_code || book.email_verification_code !== inputCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await book.update({
      is_email_verified: true,
      email_verification_code: null,
    });

    return res.status(200).json({
      message: "Email verified successfully",
      book: {
        id: book.id,
        admin_email: book.admin_email,
        is_email_verified: book.is_email_verified,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Login corporate book account
exports.loginCorporateBook = async (req, res) => {
  try {
    const { admin_email, email, password } = req.body;
    const loginEmail = String(admin_email || email || "").trim().toLowerCase();

    if (!loginEmail || !password) {
      return res.status(400).json({ error: "admin_email and password are required" });
    }

    const book = await CorporateBookAdminAccount.findOne({ where: { admin_email: loginEmail } });
    let teamAccount = null;
    let authenticatedBook = book;

    if (book) {
      const isPasswordValid = await bcrypt.compare(password, book.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });
    } else {
      teamAccount = await CorporateBookTeamAccount.findOne({ where: { email: loginEmail } });
      if (!teamAccount) return res.status(401).json({ error: "Invalid credentials" });

      const isPasswordValid = await bcrypt.compare(password, teamAccount.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

      authenticatedBook = await CorporateBookAdminAccount.findByPk(teamAccount.corporate_book_id);
      if (!authenticatedBook) return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      teamAccount
        ? {
            id: authenticatedBook.id,
            email: teamAccount.email,
            role: teamAccount.role,
            account_type: "team",
            team_account_id: teamAccount.id,
          }
        : {
            id: authenticatedBook.id,
            email: authenticatedBook.admin_email,
            role: authenticatedBook.role,
            account_type: "book",
          },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      book: {
        id: authenticatedBook.id,
        company_name: authenticatedBook.company_name,
        admin_email: teamAccount ? teamAccount.email : authenticatedBook.admin_email,
        role: teamAccount ? teamAccount.role : authenticatedBook.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current corporate book details from token
exports.getCorporateBookProfile = async (req, res) => {
  try {
    const book = await CorporateBookAdminAccount.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: CorporateBookPaymentMethod,
    });

    if (!book) return res.status(404).json({ error: "Book not found" });

    if (req.user.account_type === "team" && req.user.team_account_id) {
      const teamAccount = await CorporateBookTeamAccount.findByPk(req.user.team_account_id, {
        attributes: ["id", "name", "email", "job_title", "phone_number", "role", "is_active"],
      });

      if (!teamAccount) {
        return res.status(404).json({ error: "Team account not found" });
      }

      return res.json(mapBookProfileForTeam(book, teamAccount));
    }

    return res.json(book);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all corporate books with their payment methods
exports.getAllCorporateBooks = async (req, res) => {
  try {
    const books = await CorporateBookAdminAccount.findAll({
      include: CorporateBookPaymentMethod,
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single corporate book by ID with payment methods
exports.getCorporateBookById = async (req, res) => {
  try {
    const book = await CorporateBookAdminAccount.findByPk(req.params.id, {
      include: CorporateBookPaymentMethod,
    });

    if (!book) return res.status(404).json({ error: "Book not found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a corporate book account
exports.updateCorporateBook = async (req, res) => {
  try {
    const book = await CorporateBookAdminAccount.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    await book.update(req.body);
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a corporate book account
exports.deleteCorporateBook = async (req, res) => {
  try {
    const book = await CorporateBookAdminAccount.findByPk(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    await book.destroy();
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- PAYMENT METHODS --------------------

// Add a payment method to a book
exports.addPaymentMethod = async (req, res) => {
  try {
    const stripeConfigError = getStripeConfigError();
    if (stripeConfigError || !stripe) {
      return res.status(500).json({ error: stripeConfigError || "Stripe client is not initialized" });
    }

    const corporateBookId =
      req.body.corporate_book_id || req.body.book_id || req.body.bookId || req.body.id;

    if (!corporateBookId) {
      return res.status(400).json({
        error: "corporate_book_id (or book_id/bookId/id) is required",
      });
    }

    const book = await CorporateBookAdminAccount.findByPk(corporateBookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    let stripeCustomerId = req.body.stripe_customer_id || null;

    if (!stripeCustomerId) {
      const existingPaymentWithCustomer = await CorporateBookPaymentMethod.findOne({
        where: {
          corporate_book_id: corporateBookId,
          stripe_customer_id: { [Op.ne]: null },
        },
      });

      if (existingPaymentWithCustomer && existingPaymentWithCustomer.stripe_customer_id) {
        stripeCustomerId = existingPaymentWithCustomer.stripe_customer_id;
      }
    }

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: book.admin_email || undefined,
          name: book.company_name || book.admin_name || undefined,
          metadata: {
            corporate_book_id: String(book.id),
          },
        });

        stripeCustomerId = customer.id;
      } catch (stripeError) {
        return res.status(500).json({
          error: "Failed to create Stripe customer",
          details: stripeError.message,
        });
      }
    }

    const paymentMethod = await CorporateBookPaymentMethod.create({
      ...req.body,
      corporate_book_id: corporateBookId,
      stripe_customer_id: stripeCustomerId,
    });
    res.status(201).json(paymentMethod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payment methods of a book
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await CorporateBookPaymentMethod.findAll({
      where: { corporate_book_id: req.params.id },
    });
    res.json(paymentMethods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const method = await CorporateBookPaymentMethod.findByPk(req.params.id);
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
    const method = await CorporateBookPaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: "Payment method not found" });

    await method.destroy();
    res.json({ message: "Payment method deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};