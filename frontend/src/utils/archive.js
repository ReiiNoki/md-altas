import { citySearchAliases, countrySearchAliases } from "./locations.js";

export const INITIAL_FILTERS = {
  query: "",
  year: "all",
  region: "all",
  status: "all",
};

export function matchesQuery(event, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [
    ...citySearchAliases(event.countryCode, event.city),
    ...countrySearchAliases(event.countryCode, event.country),
    event.title,
    event.address,
    event.searchText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalized);
}

export function filterEvents(events, filters, deferredQuery = filters.query) {
  return events.filter((event) => {
    if (filters.year !== "all" && String(event.year) !== filters.year) return false;
    if (filters.region !== "all" && event.region !== filters.region) return false;
    if (filters.status !== "all" && event.status !== filters.status) return false;
    return matchesQuery(event, deferredQuery);
  });
}

export function countEventsByYear(events) {
  return events.reduce((counts, event) => {
    if (typeof event.year !== "number") return counts;
    counts[event.year] = (counts[event.year] ?? 0) + 1;
    return counts;
  }, {});
}

export function getYearRange(events) {
  const years = events.map((event) => event.year).filter(Number.isFinite);
  if (!years.length) return null;
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function expandAnalytics(data) {
  if (!Array.isArray(data?.events)) throw new TypeError("Invalid analytics payload");
  return {
    events: data.events.map(
      ([id, year, city, country, countryCode, region, missionCount, missions]) => ({
        id,
        year,
        city,
        country,
        countryCode,
        region,
        missionCount,
        missions: (missions ?? []).map(
          ([
            missionId,
            title,
            author,
            authorFaction,
            rating,
            completions,
            distanceMeters,
            timeMilliseconds,
            offline,
          ]) => ({
            id: missionId,
            title,
            author,
            authorFaction,
            rating,
            completions,
            distanceMeters,
            timeMilliseconds,
            offline,
          }),
        ),
      }),
    ),
  };
}

export function isFiniteCoordinate(value, limit) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}
