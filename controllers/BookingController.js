const Booking = require("../models/Booking");
const CorporateBookAdminAccount = require("../models/corporateBookAdminAccount");
const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateBookCustomerAccount = require("../models/corporateBookCustomerAccounts");
const CorporateHostCustomerAccount = require("../models/corporateHostCustomerAccounts");
const CorporateHostListing = require("../models/corporateHostListing");
const User = require("../models/User");
const Stripe = require("stripe");

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

const bookingInclude = [
	{
		model: CorporateBookAdminAccount,
		as: "book",
		attributes: ["id", "company_name", "admin_email", "is_active"],
	},
	{
		model: CorporateHostAccount,
		as: "host",
		attributes: ["id", "company_name", "admin_email", "is_active"],
	},
	{
		model: CorporateBookCustomerAccount,
		as: "book_customer",
		attributes: ["id", "name", "email", "phone", "is_active"],
	},
	{
		model: CorporateHostCustomerAccount,
		as: "host_customer",
		attributes: ["id", "name", "email", "phone", "is_active"],
	},
	{
		model: CorporateHostListing,
		as: "listing",
		attributes: ["id", "property_name", "status", "is_active"],
	},
];

const parseBoolean = (value, defaultValue) => {
	if (value === undefined) {
		return defaultValue;
	}

	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}

	return Boolean(value);
};

const isValidUuid = (value) => {
	if (!value || typeof value !== "string") {
		return false;
	}

	// Basic UUID v4 format check
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
};

const resolveBookingPayload = (body) => {
	const payload = { ...body };

	if (payload.corporate_book_cusomter_id && !payload.corporate_book_customer_id) {
		payload.corporate_book_customer_id = payload.corporate_book_cusomter_id;
	}

	payload.is_corporate_host_owner_of_property = parseBoolean(
		payload.is_corporate_host_owner_of_property,
		true
	);
	payload.is_corporate_book_customer = parseBoolean(payload.is_corporate_book_customer, true);
	payload.is_active = parseBoolean(payload.is_active, true);

	// Normalize empty-string IDs to null so UUID columns don't receive "" and error
	const nullableUuidFields = [
		"customer_id",
		"corporate_book_customer_id",
		"corporate_host_customer_id",
		"listing_id",
	];

	nullableUuidFields.forEach((field) => {
		if (payload[field] === "" || payload[field] === undefined) {
			payload[field] = null;
		}
	});

	// Required UUIDs: if frontend accidentally sends "", convert to null to trigger our own
	// validation logic instead of a low-level DB "invalid input syntax for type uuid" error.
	["corporate_book_id", "corporate_host_id"].forEach((field) => {
		if (payload[field] === "") {
			payload[field] = null;
		}
	});

	return payload;
};

const getUuidFieldValidationError = (payload) => {
	const uuidFields = [
		"customer_id",
		"corporate_book_id",
		"corporate_host_id",
		"corporate_book_customer_id",
		"corporate_host_customer_id",
		"listing_id",
	];

	for (const field of uuidFields) {
		const value = payload[field];
		if (value && !isValidUuid(String(value))) {
			return `${field} must be a valid UUID`;
		}
	}

	return null;
};

const parseAmountToSmallestUnit = (value) => {
	if (value === undefined || value === null || value === "") {
		return null;
	}

	const numericValue = Number(value);
	if (!Number.isFinite(numericValue) || numericValue <= 0) {
		return null;
	}

	return Math.round(numericValue * 100);
};

const validateParentRecords = async (payload) => {
	const errors = [];
	let resolvedBookCustomer = null;

	if (!payload.corporate_book_id && payload.corporate_book_customer_id) {
		resolvedBookCustomer = await CorporateBookCustomerAccount.findByPk(
			payload.corporate_book_customer_id
		);

		if (!resolvedBookCustomer) {
			return { error: "Corporate book customer not found" };
		}

		payload.corporate_book_id = resolvedBookCustomer.corporate_book_id;
	}

	let resolvedHostId = payload.corporate_host_id || null;

	if (!resolvedHostId && payload.listing_id) {
		const listingForHostResolution = await CorporateHostListing.findByPk(payload.listing_id);
		if (listingForHostResolution) {
			resolvedHostId = listingForHostResolution.corporate_host_id;
			payload.corporate_host_id = resolvedHostId;
		}
	}

	if (!resolvedHostId && payload.corporate_host_customer_id) {
		const hostCustomerForHostResolution = await CorporateHostCustomerAccount.findByPk(
			payload.corporate_host_customer_id
		);
		if (hostCustomerForHostResolution) {
			resolvedHostId = hostCustomerForHostResolution.corporate_host_id;
			payload.corporate_host_id = resolvedHostId;
		}
	}

	if (!resolvedHostId) {
		errors.push("corporate_host_id is required");
	}

	if (errors.length) {
		return { error: errors.join(", ") };
	}

	let book = null;
	if (payload.corporate_book_id) {
		book = await CorporateBookAdminAccount.findByPk(payload.corporate_book_id);

		if (!book) {
			return { error: "Corporate book not found" };
		}
	}

	let host = await CorporateHostAccount.findByPk(resolvedHostId);

	if (!host && payload.listing_id) {
		const listingForHostRetry = await CorporateHostListing.findByPk(payload.listing_id);
		if (listingForHostRetry) {
			resolvedHostId = listingForHostRetry.corporate_host_id;
			payload.corporate_host_id = resolvedHostId;
			host = await CorporateHostAccount.findByPk(resolvedHostId);
		}
	}

	if (!host) {
		return { error: "Corporate host not found" };
	}

	if (payload.corporate_book_customer_id) {
		const bookCustomer =
			resolvedBookCustomer ||
			(await CorporateBookCustomerAccount.findByPk(payload.corporate_book_customer_id));

		if (!bookCustomer) {
			return { error: "Corporate book customer not found" };
		}

		if (
			payload.corporate_book_id &&
			String(bookCustomer.corporate_book_id) !== String(payload.corporate_book_id)
		) {
			return { error: "Corporate book customer does not belong to the selected book" };
		}
	}

	if (payload.corporate_host_customer_id) {
		const hostCustomer = await CorporateHostCustomerAccount.findByPk(
			payload.corporate_host_customer_id
		);

		if (!hostCustomer) {
			return { error: "Corporate host customer not found" };
		}

		if (String(hostCustomer.corporate_host_id) !== String(resolvedHostId)) {
			return { error: "Corporate host customer does not belong to the selected host" };
		}
	}

	if (payload.listing_id) {
		const listing = await CorporateHostListing.findByPk(payload.listing_id);

		if (!listing) {
			return { error: "Listing not found" };
		}

		if (String(listing.corporate_host_id) !== String(resolvedHostId)) {
			return { error: "Listing does not belong to the selected host" };
		}
	}

	return { book, host };
};

const withClientName = (booking) => {
	if (!booking) {
		return booking;
	}

	const row = typeof booking.toJSON === "function" ? booking.toJSON() : { ...booking };
	row.client_name = row.book_customer?.name || "self";
	return row;
};

const withClientNameList = (bookings) => (bookings || []).map(withClientName);

// Create a booking
exports.createBooking = async (req, res) => {
	try {
		const {
			stripe_payment_method_id,
			amount,
			currency,
			stripe_customer_id,
			...bookingBody
		} = req.body;

		const isNormalUser = parseBoolean(req.body?.is_normal_user, false);

		if (!stripe_payment_method_id) {
			return res.status(400).json({
				error: "stripe_payment_method_id is required",
			});
		}

		const normalizedStripeCustomerId =
			typeof stripe_customer_id === "string" ? stripe_customer_id.trim() : stripe_customer_id;

		if (!isNormalUser && !normalizedStripeCustomerId) {
			return res.status(400).json({
				error: "stripe_customer_id is required",
			});
		}

		if (!stripe) {
			return res.status(500).json({
				error: "Stripe is not configured. Missing STRIPE_SECRET_KEY",
			});
		}

		const stripeConfigError = getStripeConfigError();
		if (stripeConfigError) {
			return res.status(500).json({ error: stripeConfigError });
		}

		const payload = resolveBookingPayload(bookingBody);
		if (isNormalUser && payload.customer_id && !isValidUuid(String(payload.customer_id))) {
			payload.customer_id = null;
		}
		const uuidFieldError = getUuidFieldValidationError(payload);
		if (uuidFieldError) {
			return res.status(400).json({ error: uuidFieldError });
		}

		const validation = await validateParentRecords(payload);

		if (validation.error) {
			return res.status(400).json({ error: validation.error });
		}

		const chargeAmountSource = amount ?? payload.total_amount;
		const chargeAmount = parseAmountToSmallestUnit(chargeAmountSource);
		if (!chargeAmount) {
			return res.status(400).json({
				error: "amount (or total_amount) must be a valid number greater than 0",
			});
		}

		let paymentMethod;
		try {
			paymentMethod = await stripe.paymentMethods.retrieve(stripe_payment_method_id);
		} catch (paymentMethodError) {
			let backendStripeAccountId = null;
			try {
				const stripeAccount = await stripe.accounts.retrieve();
				backendStripeAccountId = stripeAccount.id;
			} catch (accountLookupError) {
				backendStripeAccountId = null;
			}

			const isNotFoundError =
				String(paymentMethodError.message || "").toLowerCase().includes("no such paymentmethod") ||
				paymentMethodError.code === "resource_missing";

			return res.status(400).json({
				error: "Invalid stripe_payment_method_id",
				details: paymentMethodError.message,
				...(isNotFoundError
					? {
						debug_hint:
							"PaymentMethod not found in backend Stripe context. Ensure frontend and backend use the same Stripe account and both use test mode (pk_test/sk_test) or both live mode (pk_live/sk_live).",
						backend_key_prefix: String(process.env.STRIPE_SECRET_KEY || "").slice(0, 8),
						backend_account_id: backendStripeAccountId,
					}
					: {}),
			});
		}

		let stripeCustomerId = null;

		if (isNormalUser) {
			stripeCustomerId = paymentMethod.customer || null;
		} else {
			// Ensure the payment method is associated with the provided Stripe customer
			if (paymentMethod.customer && paymentMethod.customer !== normalizedStripeCustomerId) {
				return res.status(400).json({
					error: "Payment method belongs to a different Stripe customer",
					details: `payment method customer: ${paymentMethod.customer}`,
				});
			}

			if (!paymentMethod.customer) {
				try {
					await stripe.paymentMethods.attach(stripe_payment_method_id, {
						customer: normalizedStripeCustomerId,
					});
				} catch (attachError) {
					return res.status(400).json({
						error: "Failed to attach payment method to Stripe customer",
						details: attachError.message,
					});
				}
			}

			stripeCustomerId = normalizedStripeCustomerId;
		}

		let paymentIntent;
		try {
			const paymentIntentPayload = {
				amount: chargeAmount,
				currency: String(currency || "usd").toLowerCase(),
				payment_method: stripe_payment_method_id,
				confirm: true,
				off_session: Boolean(stripeCustomerId),
				automatic_payment_methods: {
					enabled: true,
					allow_redirects: "never",
				},
			};

			if (stripeCustomerId) {
				paymentIntentPayload.customer = stripeCustomerId;
			}

			paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);
		} catch (paymentError) {
			return res.status(402).json({
				error: "Payment failed",
				details: paymentError.message,
			});
		}

		if (paymentIntent.status !== "succeeded") {
			return res.status(402).json({
				error: "Payment was not successful",
				payment_status: paymentIntent.status,
			});
		}

		payload.payment_status = "paid";
		if (!payload.total_amount) {
			payload.total_amount = String(amount);
		}

		let booking;
		let createdBooking;
		try {
			booking = await Booking.create(payload);
			createdBooking = await Booking.findByPk(booking.id, {
				include: bookingInclude,
			});
		} catch (bookingError) {
			try {
				await stripe.refunds.create({ payment_intent: paymentIntent.id });
			} catch (refundError) {
				return res.status(500).json({
					error: "Booking save failed after payment. Auto-refund failed",
					details: bookingError.message,
					refund_error: refundError.message,
					payment_intent_id: paymentIntent.id,
				});
			}

			return res.status(500).json({
				error: "Booking save failed after payment. Payment was refunded",
				details: bookingError.message,
				payment_intent_id: paymentIntent.id,
			});
		}

		return res.status(201).json({
			booking: withClientName(createdBooking || booking),
			payment: {
				payment_intent_id: paymentIntent.id,
				stripe_customer_id: stripeCustomerId,
				stripe_payment_method_id,
				status: paymentIntent.status,
				currency: paymentIntent.currency,
				amount: paymentIntent.amount,
			},
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
	try {
		const bookings = await Booking.findAll({
			include: bookingInclude,
			order: [["created_at", "DESC"]],
		});

		return res.json(withClientNameList(bookings));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get a booking by ID
exports.getBookingById = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id, {
			include: bookingInclude,
		});

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		return res.json(withClientName(booking));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Update a booking
exports.updateBooking = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		const payload = resolveBookingPayload(req.body);

		if (
			payload.corporate_book_id ||
			payload.corporate_host_id ||
			payload.corporate_book_customer_id ||
			payload.corporate_host_customer_id ||
			payload.listing_id
		) {
			const validation = await validateParentRecords({
				corporate_book_id: payload.corporate_book_id || booking.corporate_book_id,
				corporate_host_id: payload.corporate_host_id || booking.corporate_host_id,
				corporate_book_customer_id:
					payload.corporate_book_customer_id || booking.corporate_book_customer_id,
				corporate_host_customer_id:
					payload.corporate_host_customer_id || booking.corporate_host_customer_id,
				listing_id: payload.listing_id || booking.listing_id,
			});

			if (validation.error) {
				return res.status(400).json({ error: validation.error });
			}
		}

		await booking.update(payload);

		const updatedBooking = await Booking.findByPk(booking.id, {
			include: bookingInclude,
		});

		return res.json(withClientName(updatedBooking || booking));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		await booking.destroy();

		return res.json({ message: "Booking deleted successfully" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get bookings for a specific corporate book
exports.getBookingsByCorporateBook = async (req, res) => {
	try {
		const book = await CorporateBookAdminAccount.findByPk(req.params.bookId);
		if (!book) {
			return res.status(404).json({ error: "Corporate book not found" });
		}

		const bookings = await Booking.findAll({
			where: { corporate_book_id: req.params.bookId },
			include: bookingInclude,
			order: [["created_at", "DESC"]],
		});

		return res.json(withClientNameList(bookings));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get bookings for a specific corporate host
exports.getBookingsByCorporateHost = async (req, res) => {
	try {
		const host = await CorporateHostAccount.findByPk(req.params.hostId);
		if (!host) {
			return res.status(404).json({ error: "Corporate host not found" });
		}

		const bookings = await Booking.findAll({
			where: { corporate_host_id: req.params.hostId },
			include: bookingInclude,
			order: [["created_at", "DESC"]],
		});

		return res.json(withClientNameList(bookings));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get bookings for a specific user customer
exports.getBookingsByCustomer = async (req, res) => {
	try {
		const customer = await User.findByPk(req.params.customerId);
		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		const bookings = await Booking.findAll({
			where: { customer_id: req.params.customerId },
			include: bookingInclude,
			order: [["created_at", "DESC"]],
		});

		return res.json(withClientNameList(bookings));
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
