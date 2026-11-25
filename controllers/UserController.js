const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const sanitizeUser = (user) => {
	const plain = user.toJSON();
	delete plain.password;
	return plain;
};

// Signup / create user
exports.createUser = async (req, res) => {
	try {
		const { password, email, ...rest } = req.body;

		if (!email) {
			return res.status(400).json({ error: "email is required" });
		}
		if (!password) {
			return res.status(400).json({ error: "password is required" });
		}

		const normalizedEmail = String(email).trim().toLowerCase();
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await User.create({
			...rest,
			email: normalizedEmail,
			password: hashedPassword,
		});

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				account_type: "user",
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		return res.status(201).json({
			user: sanitizeUser(user),
			token,
			message: "User created successfully",
		});
	} catch (err) {
		if (err.name === "SequelizeUniqueConstraintError") {
			return res.status(400).json({ error: "email already exists" });
		}
		return res.status(500).json({ error: err.message });
	}
};

// Login user
exports.loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;
		const loginEmail = String(email || "").trim().toLowerCase();

		if (!loginEmail || !password) {
			return res
				.status(400)
				.json({ error: "email and password are required" });
		}

		const user = await User.findOne({ where: { email: loginEmail } });
		if (!user) return res.status(401).json({ error: "Invalid credentials" });

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid)
			return res.status(401).json({ error: "Invalid credentials" });

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				account_type: "user",
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);

		return res.status(200).json({
			user: sanitizeUser(user),
			token,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Logout user (JWT is stateless, logout handled on client)
exports.logoutUser = async (req, res) => {
	return res.status(200).json({ message: "Logout successful" });
};

// Get current user details from token
exports.getUserProfile = async (req, res) => {
	try {
		const userId = req.user && req.user.id;
		if (!userId) {
			return res.status(401).json({ error: "Invalid token payload" });
		}

		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.status(200).json(sanitizeUser(user));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

