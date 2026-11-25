const { Op } = require("sequelize");
const CorporateHostAccount = require("../models/corporateHostAccount");
const CorporateHostCustomerAccount = require("../models/corporateHostCustomerAccounts");
const CorporateHostListing = require("../models/corporateHostListing");
const { filterListingsByLocation } = require("../utils/locationUtils");

const isListingWithinDateRange = (listing, todayDateOnly) => {
	const startRaw = listing.start_date;
	const endRaw = listing.end_date;

	const hasStart = startRaw !== undefined && startRaw !== null && String(startRaw).trim() !== "";
	const hasEnd = endRaw !== undefined && endRaw !== null && String(endRaw).trim() !== "";

	if (hasStart) {
		const startDate = new Date(startRaw);
		if (Number.isNaN(startDate.getTime())) return false;
		startDate.setHours(0, 0, 0, 0);
		if (startDate > todayDateOnly) return false;
	}

	if (hasEnd) {
		const endDate = new Date(endRaw);
		if (Number.isNaN(endDate.getTime())) return false;
		endDate.setHours(0, 0, 0, 0);
		if (endDate < todayDateOnly) return false;
	}

	return true;
};

const buildListingIncludes = () => [
	{
		model: CorporateHostAccount,
		as: "host",
		attributes: ["id", "company_name", "admin_email", "is_active"],
	},
	{
		model: CorporateHostCustomerAccount,
		as: "customer",
		attributes: ["id", "name", "email", "is_active"],
	},
];

const parseCsv = (value) =>
	String(value || "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);

const parseBoolean = (value) => {
	if (value === undefined || value === null || value === "") return undefined;
	const normalized = String(value).trim().toLowerCase();
	if (normalized === "true") return true;
	if (normalized === "false") return false;
	return undefined;
};

const buildListingsWhereFromQuery = (query) => {
	const {
		corporate_host_id,
		corporate_host_customer_id,
		client_ids,
		is_active,
		is_corporate_owner_of_property,
		property_type,
		property_types,
		property_name,
		name,
		area,
		min_area,
		max_area,
		area_min,
		area_max,
		min_price,
		max_price,
		price_type,
		min,
		max,
		bathrooms,
		bedrooms,
		guests,
		kitchen,
		status,
		booking_availability,
	} = query;

	const where = {};

	if (corporate_host_id) where.corporate_host_id = corporate_host_id;

	if (corporate_host_customer_id) {
		where.corporate_host_customer_id = corporate_host_customer_id;
	}

	if (client_ids) {
		const ids = parseCsv(client_ids);
		if (ids.length > 0) {
			where.corporate_host_customer_id = { [Op.in]: ids };
		}
	}

	const parsedIsActive = parseBoolean(is_active);
	if (parsedIsActive !== undefined) {
		where.is_active = parsedIsActive;
	}

	const parsedCorporateOwner = parseBoolean(is_corporate_owner_of_property);
	if (parsedCorporateOwner !== undefined) {
		where.is_corporate_owner_of_property = parsedCorporateOwner;
	}

	if (property_type) {
		where.property_type = property_type;
	}

	if (property_types) {
		const types = parseCsv(property_types);
		if (types.length > 0) {
			where.property_type = { [Op.in]: types };
		}
	}

	const listingName = property_name || name;
	if (listingName) {
		where.property_name = { [Op.iLike]: `%${String(listingName).trim()}%` };
	}

	// Area filters (supports both min_area/max_area and area_min/area_max)
	const effectiveMinArea =
		min_area !== undefined && min_area !== ""
			? min_area
			: area_min !== undefined && area_min !== ""
				? area_min
				: undefined;
	const effectiveMaxArea =
		max_area !== undefined && max_area !== ""
			? max_area
			: area_max !== undefined && area_max !== ""
				? area_max
				: undefined;

	const hasArea = area !== undefined && area !== "";
	const hasMinArea = effectiveMinArea !== undefined && effectiveMinArea !== "";
	const hasMaxArea = effectiveMaxArea !== undefined && effectiveMaxArea !== "";

	if (hasArea) {
		where.area = Number(area);
	} else if (hasMinArea || hasMaxArea) {
		where.area = {};
		if (hasMinArea) where.area[Op.gte] = Number(effectiveMinArea);
		if (hasMaxArea) where.area[Op.lte] = Number(effectiveMaxArea);
	}

	// Price filters: support both min_price/max_price and min/max
	const effectiveMinPrice =
		min_price !== undefined && min_price !== ""
			? min_price
			: min !== undefined && min !== ""
				? min
				: undefined;
	const effectiveMaxPrice =
		max_price !== undefined && max_price !== ""
			? max_price
			: max !== undefined && max !== ""
				? max
				: undefined;

	const hasMinPrice = effectiveMinPrice !== undefined && effectiveMinPrice !== "";
	const hasMaxPrice = effectiveMaxPrice !== undefined && effectiveMaxPrice !== "";

	if (hasMinPrice || hasMaxPrice) {
		const priceFilter = {};
		if (hasMinPrice) priceFilter[Op.gte] = Number(effectiveMinPrice);
		if (hasMaxPrice) priceFilter[Op.lte] = Number(effectiveMaxPrice);

		const normalizedPriceType = String(price_type || "both").toLowerCase();
		if (normalizedPriceType === "monthly") {
			where.monthly_price = priceFilter;
		} else if (normalizedPriceType === "night") {
			where.price_per_night = priceFilter;
		} else {
			where[Op.or] = [{ monthly_price: priceFilter }, { price_per_night: priceFilter }];
		}
	}

	// Numeric capability filters (treated as minimums)
	if (bathrooms !== undefined && bathrooms !== "") {
		where.bathrooms = { [Op.gte]: Number(bathrooms) };
	}

	if (bedrooms !== undefined && bedrooms !== "") {
		where.bedrooms = { [Op.gte]: Number(bedrooms) };
	}

	if (guests !== undefined && guests !== "") {
		where.guests = { [Op.gte]: Number(guests) };
	}

	if (kitchen !== undefined && kitchen !== "") {
		where.kitchen = { [Op.gte]: Number(kitchen) };
	}

	// Simple status/availability flags
	if (status) {
		where.status = status;
	}

	if (booking_availability) {
		where.booking_availability = booking_availability;
	}

	return where;
};

// Apply in-memory, advanced filters (location, amenities, dates, guests, pets)
// on top of the database result set.
const applyAdvancedListingFilters = (listings, query) => {
	if (!Array.isArray(listings) || listings.length === 0) return [];

	const {
		amenities,
		check_in,
		check_out,
		adults,
		children,
		infants,
		pets,
	} = query;

	// Collect borough and neighborhood filters from any query keys that contain these words
	const boroughNames = [];
	const neighborhoodNames = [];

	Object.keys(query || {}).forEach((key) => {
		const lowerKey = String(key).toLowerCase();
		const value = query[key];
		if (value === undefined || value === null || value === "") return;

		if (lowerKey.includes("borough")) {
			boroughNames.push(...parseCsv(String(value)));
		} else if (lowerKey.includes("neighb")) {
			neighborhoodNames.push(...parseCsv(String(value)));
		}
	});

	// Location filtering (borough + neighborhood) using polygon data
	let filtered = filterListingsByLocation(listings, {
		boroughNames,
		neighborhoodNames,
	});

	// Amenity filtering (requires all requested amenities across all amenity arrays)
	const requestedAmenities = amenities ? parseCsv(amenities).map((a) => a.toLowerCase()) : [];

	if (requestedAmenities.length > 0) {
		filtered = filtered.filter((listing) => {
			const allAmenities = [
				...(listing.common_amenities || []),
				...(listing.special_features || []),
				...(listing.additional_features || []),
				...(listing.safety_security_features || []),
			]
				.map((a) => String(a || "").trim().toLowerCase())
				.filter(Boolean);

			return requestedAmenities.every((reqAmenity) =>
				allAmenities.includes(reqAmenity)
			);
		});
	}

	// Occupancy filtering based on adults/children/infants
	const numAdults = adults !== undefined ? Number(adults) || 0 : 0;
	const numChildren = children !== undefined ? Number(children) || 0 : 0;
	const numInfants = infants !== undefined ? Number(infants) || 0 : 0;
	const totalGuestsRequired = numAdults + numChildren + numInfants;

	if (totalGuestsRequired > 0) {
		filtered = filtered.filter((listing) => {
			if (listing.guests === null || listing.guests === undefined) return false;
			const maxGuests = Number(listing.guests);
			if (Number.isNaN(maxGuests)) return false;
			return maxGuests >= totalGuestsRequired;
		});
	}

	// Date-range availability filtering (check_in/check_out within listing's availability window)
	let requestedCheckIn = null;
	let requestedCheckOut = null;

	if (check_in) {
		const d = new Date(check_in);
		if (!Number.isNaN(d.getTime())) {
			requestedCheckIn = d;
			requestedCheckIn.setHours(0, 0, 0, 0);
		}
	}

	if (check_out) {
		const d = new Date(check_out);
		if (!Number.isNaN(d.getTime())) {
			requestedCheckOut = d;
			requestedCheckOut.setHours(0, 0, 0, 0);
		}
	}

	if (
		requestedCheckIn &&
		requestedCheckOut &&
		requestedCheckOut.getTime() >= requestedCheckIn.getTime()
	) {
		filtered = filtered.filter((listing) => {
			const availability = String(listing.booking_availability || "").toLowerCase();

			const startRaw = listing.start_date;
			const endRaw = listing.end_date;

			let startDate = null;
			let endDate = null;

			if (startRaw !== undefined && startRaw !== null && String(startRaw).trim() !== "") {
				const d = new Date(startRaw);
				if (!Number.isNaN(d.getTime())) {
					d.setHours(0, 0, 0, 0);
					startDate = d;
				}
			}

			if (endRaw !== undefined && endRaw !== null && String(endRaw).trim() !== "") {
				const d = new Date(endRaw);
				if (!Number.isNaN(d.getTime())) {
					d.setHours(0, 0, 0, 0);
					endDate = d;
				}
			}

			// If booking availability is "always" and no explicit range, treat as always available
			if (!startDate && !endDate && availability === "always") {
				return true;
			}

			// Fallback: use requested range bounds when one side is missing
			const effectiveStart = startDate || requestedCheckIn;
			const effectiveEnd = endDate || requestedCheckOut;

			return (
				effectiveStart.getTime() <= requestedCheckIn.getTime() &&
				effectiveEnd.getTime() >= requestedCheckOut.getTime()
			);
		});
	}

	// Very simple pets filter: require not explicitly forbidding pets when pets=yes
	if (pets && String(pets).trim().toLowerCase() === "yes") {
		filtered = filtered.filter((listing) => {
			const rules = [
				...(listing.house_rules || []),
				...(listing.additional_house_rules || []),
			].map((r) => String(r || "").toLowerCase());

			const forbidsPets = rules.some((r) => r.includes("no pets"));
			if (forbidsPets) return false;

			const amenityArrays = [
				...(listing.property_tags || []),
				...(listing.common_amenities || []),
				...(listing.additional_features || []),
			].map((a) => String(a || "").toLowerCase());

			const mentionsPets = amenityArrays.some((a) => a.includes("pet"));
			// If we don't have strong data either way, keep the listing
			return mentionsPets || !forbidsPets;
		});
	}

	return filtered;
};

// Create a new listing
exports.createListing = async (req, res) => {
	try {
		const { corporate_host_id, corporate_host_customer_id } = req.body;

		if (!corporate_host_id) {
			return res.status(400).json({ error: "corporate_host_id is required" });
		}

		const host = await CorporateHostAccount.findByPk(corporate_host_id);
		if (!host) {
			return res.status(404).json({ error: "Host not found" });
		}

		if (corporate_host_customer_id) {
			const customer = await CorporateHostCustomerAccount.findByPk(corporate_host_customer_id);
			if (!customer) {
				return res.status(404).json({ error: "Customer not found" });
			}

			if (customer.corporate_host_id !== corporate_host_id) {
				return res.status(400).json({ error: "Customer does not belong to this host" });
			}
		}

		const listing = await CorporateHostListing.create(req.body);
		const created = await CorporateHostListing.findByPk(listing.id, {
			include: buildListingIncludes(),
		});

		return res.status(201).json(created);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get all listings (supports simple filters)
exports.getAllListings = async (req, res) => {
	try {
		const where = buildListingsWhereFromQuery(req.query);

		const listings = await CorporateHostListing.findAll({
			where,
			include: buildListingIncludes(),
			order: [["created_at", "DESC"]],
		});

		const filtered = applyAdvancedListingFilters(listings, req.query);

		return res.json(filtered);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get only currently available listings
exports.getAvailableListings = async (req, res) => {
	try {
		const baseWhere = {
			is_active: true,
			status: { [Op.ne]: "Booked" },
		};

		const queryWhere = buildListingsWhereFromQuery(req.query);
		const where = { ...queryWhere, ...baseWhere };

		const listings = await CorporateHostListing.findAll({
			where,
			include: buildListingIncludes(),
			order: [["created_at", "DESC"]],
		});

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const availableListings = listings.filter((listing) =>
			isListingWithinDateRange(listing, today)
		);

		return res.json(availableListings);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Filter listings by clients/corporate owner/prices/property type
exports.filterListings = async (req, res) => {
	try {
		const where = buildListingsWhereFromQuery(req.query);

		const listings = await CorporateHostListing.findAll({
			where,
			include: buildListingIncludes(),
			order: [["created_at", "DESC"]],
		});

		const filtered = applyAdvancedListingFilters(listings, req.query);

		return res.json(filtered);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get a listing by id
exports.getListingById = async (req, res) => {
	try {
		const listing = await CorporateHostListing.findByPk(req.params.id, {
			include: buildListingIncludes(),
		});

		if (!listing) {
			return res.status(404).json({ error: "Listing not found" });
		}

		return res.json(listing);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get all listings belonging to a host
exports.getListingsByHost = async (req, res) => {
	try {
		const host = await CorporateHostAccount.findByPk(req.params.hostId);
		if (!host) {
			return res.status(404).json({ error: "Host not found" });
		}

		const where = buildListingsWhereFromQuery(req.query);
		where.corporate_host_id = req.params.hostId;

		const listings = await CorporateHostListing.findAll({
			where,
			include: buildListingIncludes(),
			order: [["created_at", "DESC"]],
		});

		return res.json(listings);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Get all listings linked to a customer
exports.getListingsByCustomer = async (req, res) => {
	try {
		const customer = await CorporateHostCustomerAccount.findByPk(req.params.customerId);
		if (!customer) {
			return res.status(404).json({ error: "Customer not found" });
		}

		const listings = await CorporateHostListing.findAll({
			where: { corporate_host_customer_id: req.params.customerId },
			include: buildListingIncludes(),
			order: [["created_at", "DESC"]],
		});

		return res.json(listings);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Update a listing
exports.updateListing = async (req, res) => {
	try {
		const listing = await CorporateHostListing.findByPk(req.params.id);
		if (!listing) {
			return res.status(404).json({ error: "Listing not found" });
		}

		const payload = { ...req.body };
		delete payload.id;

		const nextHostId = payload.corporate_host_id || listing.corporate_host_id;
		const nextCustomerId =
			payload.corporate_host_customer_id !== undefined
				? payload.corporate_host_customer_id
				: listing.corporate_host_customer_id;

		if (payload.corporate_host_id) {
			const host = await CorporateHostAccount.findByPk(nextHostId);
			if (!host) {
				return res.status(404).json({ error: "Host not found" });
			}
		}

		if (nextCustomerId) {
			const customer = await CorporateHostCustomerAccount.findByPk(nextCustomerId);
			if (!customer) {
				return res.status(404).json({ error: "Customer not found" });
			}

			if (customer.corporate_host_id !== nextHostId) {
				return res.status(400).json({ error: "Customer does not belong to this host" });
			}
		}

		await listing.update(payload);

		const updated = await CorporateHostListing.findByPk(listing.id, {
			include: buildListingIncludes(),
		});

		return res.json(updated);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// Delete a listing
exports.deleteListing = async (req, res) => {
	try {
		const listing = await CorporateHostListing.findByPk(req.params.id);
		if (!listing) {
			return res.status(404).json({ error: "Listing not found" });
		}

		await listing.destroy();
		return res.json({ message: "Listing deleted successfully" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};
