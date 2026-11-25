const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Admin = require("../models/Admin");
const Booking = require("../models/Booking");
const CorporateBookAdminAccount = require("../models/corporateBookAdminAccount");
const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateBookTeamAccount = require("../models/corporateBookTeamAccounts");
const CorporateHostTeamAccount = require("../models/corporateHostTeamAccounts");
require("dotenv").config();

const sanitizeAdmin = (admin) => {
	const plain = admin.toJSON();
	delete plain.password;
	return plain;
};

const sanitizeTeamAccount = (team) => {
	const plain = team.toJSON();
	delete plain.password;
	return plain;
};

const toNumber = (value) => {
	if (value === null || value === undefined || value === "") return 0;
	const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
	return Number.isFinite(parsed) ? parsed : 0;
};

const buildBookingStats = (bookings) => {
	const stats = {
		total_bookings: bookings.length,
		confirmed_bookings: 0,
		pending_bookings: 0,
		cancelled_bookings: 0,
		paid_bookings: 0,
		pending_payment_bookings: 0,
		refunded_bookings: 0,
		total_revenue: 0,
		paid_revenue: 0,
		refunded_revenue: 0,
		average_booking_value: 0,
	};

	for (const booking of bookings) {
		const amount = toNumber(booking.total_amount);
		stats.total_revenue += amount;

		if (booking.status === "confirmed") stats.confirmed_bookings += 1;
		if (booking.status === "pending") stats.pending_bookings += 1;
		if (booking.status === "cancelled") stats.cancelled_bookings += 1;

		if (booking.payment_status === "paid") {
			stats.paid_bookings += 1;
			stats.paid_revenue += amount;
		}
		if (booking.payment_status === "pending") stats.pending_payment_bookings += 1;
		if (booking.payment_status === "refunded") {
			stats.refunded_bookings += 1;
			stats.refunded_revenue += amount;
		}
	}

	if (stats.total_bookings > 0) {
		stats.average_booking_value = Number((stats.total_revenue / stats.total_bookings).toFixed(2));
	}

	stats.total_revenue = Number(stats.total_revenue.toFixed(2));
	stats.paid_revenue = Number(stats.paid_revenue.toFixed(2));
	stats.refunded_revenue = Number(stats.refunded_revenue.toFixed(2));

	return stats;
};

// Create a new admin account
exports.createAdmin = async (req, res) => {
	try {
		const { password, ...rest } = req.body;

		if (!rest.admin_email) {
			return res.status(400).json({ error: "admin_email is required" });
		}
		if (!password) {
			return res.status(400).json({ error: "Password is required" });
		}

		const normalizedEmail = String(rest.admin_email).trim().toLowerCase();
		const hashedPassword = await bcrypt.hash(password, 10);

		const admin = await Admin.create({
			...rest,
			admin_email: normalizedEmail,
			password: hashedPassword,
		});

		const token = jwt.sign(
			{
				id: admin.id,
				email: admin.admin_email,
				role: admin.role,
				account_type: "admin",
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		return res.status(201).json({
			admin: sanitizeAdmin(admin),
			token,
			message: "Admin created successfully",
		});
	} catch (err) {
		if (err.name === "SequelizeUniqueConstraintError") {
			return res.status(400).json({ error: "admin_email already exists" });
		}
		return res.status(500).json({ error: err.message });
	}
};

// Login admin
exports.loginAdmin = async (req, res) => {
	try {
		const { admin_email, email, password } = req.body;
		const loginEmail = String(admin_email || email || "").trim().toLowerCase();

		if (!loginEmail || !password) {
			return res.status(400).json({ error: "admin_email and password are required" });
		}

		const admin = await Admin.findOne({ where: { admin_email: loginEmail } });
		if (!admin) return res.status(401).json({ error: "Invalid credentials" });

		const isPasswordValid = await bcrypt.compare(password, admin.password);
		if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

		const token = jwt.sign(
			{
				id: admin.id,
				email: admin.admin_email,
				role: admin.role,
				account_type: "admin",
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		return res.status(200).json({
			admin: sanitizeAdmin(admin),
			token,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Logout admin (JWT is stateless, logout is handled on client by deleting token)
exports.logoutAdmin = async (req, res) => {
	return res.status(200).json({ message: "Logout successful" });
};

// Get current admin details from token
exports.getAdminProfile = async (req, res) => {
	try {
		const admin = await Admin.findByPk(req.user.id);
		if (!admin) return res.status(404).json({ error: "Admin not found" });

		return res.status(200).json(sanitizeAdmin(admin));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get corporate booking account admin analytics (book accounts only)
exports.getCorporateBookingAccountAdmin = async (req, res) => {
	try {
		const [corporateBooks, bookings] = await Promise.all([
			CorporateBookAdminAccount.findAll({ attributes: { exclude: ["password"] } }),
			Booking.findAll({
				attributes: ["id", "corporate_book_id", "status", "payment_status", "total_amount"],
				where: { corporate_book_id: { [Op.ne]: null } },
			}),
		]);

		const bookingsByBookId = new Map();

		for (const booking of bookings) {
			if (booking.corporate_book_id) {
				const list = bookingsByBookId.get(booking.corporate_book_id) || [];
				list.push(booking);
				bookingsByBookId.set(booking.corporate_book_id, list);
			}
		}

		const corporateBookAccounts = corporateBooks.map((book) => {
			const plainBook = book.toJSON();
			const accountBookings = bookingsByBookId.get(book.id) || [];
			return {
				...plainBook,
				stats: buildBookingStats(accountBookings),
			};
		});

		const globalBookingStats = buildBookingStats(bookings);

		return res.status(200).json({
			summary: {
				total_corporate_book_accounts: corporateBooks.length,
				...globalBookingStats,
			},
			corporate_book_accounts: corporateBookAccounts,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get corporate hosting account admin analytics (host accounts only)
exports.getCorporateHostingAccountAdmin = async (req, res) => {
	try {
		const [corporateHosts, bookings] = await Promise.all([
			CorporateHostAccount.findAll({ attributes: { exclude: ["password"] } }),
			Booking.findAll({
				attributes: ["id", "corporate_host_id", "status", "payment_status", "total_amount"],
				where: { corporate_host_id: { [Op.ne]: null } },
			}),
		]);

		const bookingsByHostId = new Map();
		for (const booking of bookings) {
			if (booking.corporate_host_id) {
				const list = bookingsByHostId.get(booking.corporate_host_id) || [];
				list.push(booking);
				bookingsByHostId.set(booking.corporate_host_id, list);
			}
		}

		const corporateHostAccounts = corporateHosts.map((host) => {
			const plainHost = host.toJSON();
			const accountBookings = bookingsByHostId.get(host.id) || [];
			return {
				...plainHost,
				stats: buildBookingStats(accountBookings),
			};
		});

		const globalBookingStats = buildBookingStats(bookings);

		return res.status(200).json({
			summary: {
				total_corporate_host_accounts: corporateHosts.length,
				...globalBookingStats,
			},
			corporate_host_accounts: corporateHostAccounts,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get all admins
exports.getAllAdmins = async (req, res) => {
	try {
		const admins = await Admin.findAll({
			attributes: { exclude: ["password"] },
		});
		return res.status(200).json(admins);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get a single admin by ID
exports.getAdminById = async (req, res) => {
	try {
		const admin = await Admin.findByPk(req.params.id, {
			attributes: { exclude: ["password"] },
		});

		if (!admin) return res.status(404).json({ error: "Admin not found" });
		return res.status(200).json(admin);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Update admin
exports.updateAdmin = async (req, res) => {
	try {
		const admin = await Admin.findByPk(req.params.id);
		if (!admin) return res.status(404).json({ error: "Admin not found" });

		const payload = { ...req.body };

		if (payload.admin_email) {
			payload.admin_email = String(payload.admin_email).trim().toLowerCase();
		}
		if (payload.password) {
			payload.password = await bcrypt.hash(payload.password, 10);
		}

		await admin.update(payload);

		return res.status(200).json(sanitizeAdmin(admin));
	} catch (err) {
		if (err.name === "SequelizeUniqueConstraintError") {
			return res.status(400).json({ error: "admin_email already exists" });
		}
		return res.status(500).json({ error: err.message });
	}
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
	try {
		const admin = await Admin.findByPk(req.params.id);
		if (!admin) return res.status(404).json({ error: "Admin not found" });

		await admin.destroy();
		return res.status(200).json({ message: "Admin deleted successfully" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
