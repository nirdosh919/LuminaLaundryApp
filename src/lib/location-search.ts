export type LocationPoint = {
  latitude: number;
  longitude: number;
};

export type GeocodeResult = LocationPoint & {
  label: string;
};

const GEOCODING_URL = process.env.EXPO_PUBLIC_GEOCODING_URL?.trim();

export const isGeocodingConfigured = Boolean(GEOCODING_URL);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseResult(value: unknown): GeocodeResult | null {
  if (!isRecord(value)) return null;

  const latitude = value.latitude;
  const longitude = value.longitude;
  const label = value.label;
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof label !== "string" ||
    !label.trim()
  ) {
    return null;
  }

  return { latitude, longitude, label: label.trim() };
}

export async function searchAddress(
  query: string,
): Promise<GeocodeResult[]> {
  if (!GEOCODING_URL) {
    throw new Error("Address search is not configured. Enter the address manually.");
  }
  if (!query.trim()) {
    throw new Error("Enter an address to search.");
  }

  let url: URL;
  try {
    url = new URL(GEOCODING_URL);
  } catch {
    throw new Error("The configured geocoding URL is invalid.");
  }
  url.searchParams.set("q", query.trim());

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Address search failed with status ${response.status}.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Address search returned an invalid response.");
  }

  const results = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.results)
      ? payload.results
      : null;
  if (!results) {
    throw new Error(
      'Geocoding response must be an array or an object with a "results" array.',
    );
  }

  return results
    .map(parseResult)
    .filter((result): result is GeocodeResult => result !== null);
}
