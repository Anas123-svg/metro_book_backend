const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Lazily loaded cached borough data
let cachedBoroughs = null;

const BOROUGH_TS_FILES = [
	{ file: "bronxData.ts", varName: "BronxData" },
	{ file: "brooklynData.ts", varName: "BrooklynData" },
	{ file: "manhattanData.ts", varName: "ManhattanData" },
	{ file: "queensData.ts", varName: "QueensData" },
	{ file: "statenIslandData.ts", varName: "StatenIslandData" },
];

const loadBoroughsFromTsFiles = () => {
	if (cachedBoroughs) return cachedBoroughs;

	const result = [];

	for (const { file, varName } of BOROUGH_TS_FILES) {
		try {
			const tsPath = path.join(__dirname, "..", "data", file);
			if (!fs.existsSync(tsPath)) continue;

			const tsSource = fs.readFileSync(tsPath, "utf8");

			// Strip TypeScript-specific syntax so it can be evaluated as plain JS
			let jsSource = tsSource
				// Remove imports
				.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?/g, "")
				// Remove exported interfaces
				.replace(/export\s+interface[\s\S]*?}\s*/g, "")
				// Replace typed export with plain var assignment
				.replace(
					new RegExp(`export\\s+const\\s+${varName}\\s*:\\s*Borough\\[\\]\\s*=`, "m"),
					`var ${varName} =`
				)
				// Fallback: untyped export
				.replace(
					new RegExp(`export\\s+const\\s+${varName}\\s*=`, "m"),
					`var ${varName} =`
				)
				// Remove any remaining "export { ... }" statements
				.replace(/export\s+{[^}]+};?/g, "");

			const sandbox = {};
			vm.createContext(sandbox);
			vm.runInContext(jsSource, sandbox, { timeout: 5000 });

			const boroughArray = sandbox[varName];
			if (Array.isArray(boroughArray)) {
				result.push(...boroughArray);
			}
		} catch (err) {
			// If anything goes wrong, log once and continue; location filtering will gracefully no-op
			console.error(`Failed to load borough data from ${file}:`, err.message);
		}
	}

	cachedBoroughs = result;
	return cachedBoroughs;
};

// Standard ray-casting point-in-polygon test
const isPointInPolygon = (lat, lng, polygonCoords) => {
	if (!Array.isArray(polygonCoords) || polygonCoords.length < 3) return false;

	let inside = false;
	for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
		const xi = Number(polygonCoords[i].lat);
		const yi = Number(polygonCoords[i].lng);
		const xj = Number(polygonCoords[j].lat);
		const yj = Number(polygonCoords[j].lng);

		if (
			Number.isNaN(xi) ||
			Number.isNaN(yi) ||
			Number.isNaN(xj) ||
			Number.isNaN(yj)
		) {
			continue;
		}

		const intersect =
			yi > lng !== yj > lng &&
			lat < ((xj - xi) * (lng - yi)) / (yj - yi + 0.0) + xi;

		if (intersect) inside = !inside;
	}

	return inside;
};

// Get flattened list of neighborhood polygons filtered by borough and/or neighborhood names
const getNeighborhoodPolygons = ({ boroughNames = [], neighborhoodNames = [] } = {}) => {
	const boroughs = loadBoroughsFromTsFiles();
	if (!boroughs || boroughs.length === 0) return [];

	const normalizedBoroughs = boroughNames.map((b) => String(b).trim().toLowerCase());
	const normalizedNeighborhoods = neighborhoodNames.map((n) =>
		String(n).trim().toLowerCase()
	);

	const polygons = [];

	boroughs.forEach((borough) => {
		if (!borough || !Array.isArray(borough.neighborhoods)) return;

		const boroughNameNorm = String(borough.name || "").trim().toLowerCase();
		if (normalizedBoroughs.length > 0 && !normalizedBoroughs.includes(boroughNameNorm)) {
			return;
		}

		borough.neighborhoods.forEach((n) => {
			if (!n || !Array.isArray(n.coordinates)) return;

			const neighNameNorm = String(n.name || "").trim().toLowerCase();
			if (
				normalizedNeighborhoods.length > 0 &&
				!normalizedNeighborhoods.includes(neighNameNorm)
			) {
				return;
			}

			polygons.push({
				borough: borough.name,
				neighborhood: n.name,
				coordinates: n.coordinates,
			});
		});
	});

	return polygons;
};

const filterListingsByLocation = (listings, { boroughNames = [], neighborhoodNames = [] } = {}) => {
	if (!Array.isArray(listings) || listings.length === 0) return [];
	if (
		(!boroughNames || boroughNames.length === 0) &&
		(!neighborhoodNames || neighborhoodNames.length === 0)
	) {
		return listings;
	}

	const polygons = getNeighborhoodPolygons({ boroughNames, neighborhoodNames });
	if (!polygons || polygons.length === 0) {
		// If borough/neighborhood filters were provided but we couldn't
		// resolve any matching polygons, treat as no location matches
		// instead of returning all listings.
		return [];
	}

	return listings.filter((listing) => {
		const lat = listing && listing.latitude != null ? Number(listing.latitude) : NaN;
		const lng = listing && listing.longitude != null ? Number(listing.longitude) : NaN;

		if (Number.isNaN(lat) || Number.isNaN(lng)) return false;

		for (const poly of polygons) {
			if (isPointInPolygon(lat, lng, poly.coordinates)) {
				return true;
			}
		}
		return false;
	});
};

module.exports = {
	loadBoroughsFromTsFiles,
	getNeighborhoodPolygons,
	isPointInPolygon,
	filterListingsByLocation,
};
