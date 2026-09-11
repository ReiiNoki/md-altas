import { Filter, X } from "lucide-react";
import { useLanguage } from "../i18n.jsx";

export function FilterConsole({ filters, years, onFilterChange, onReset, onClose }) {
  const { t } = useLanguage();

  return (
    <section className="filter-console" id="filter-console" aria-label={t("filters")}>
      <header>
        <span>
          <Filter size={14} />
          {t("filterConsole")}
        </span>
        <div>
          <button type="button" onClick={onReset}>
            {t("resetAll")}
          </button>
          <button type="button" aria-label={t("closeFilters")} onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </header>
      <label>
        {t("year")}
        <select
          value={filters.year}
          onChange={(event) => onFilterChange("year", event.target.value)}
        >
          <option value="all">{t("allYears")}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("region")}
        <select
          value={filters.region}
          onChange={(event) => onFilterChange("region", event.target.value)}
        >
          <option value="all">{t("allRegions")}</option>
          <option value="APAC">APAC</option>
          <option value="EMEA">EMEA</option>
          <option value="AMER">AMER</option>
        </select>
      </label>
      <label>
        {t("status")}
        <select
          value={filters.status}
          onChange={(event) => onFilterChange("status", event.target.value)}
        >
          <option value="all">{t("allStatus")}</option>
          <option value="online">{t("online")}</option>
          <option value="partially_offline">{t("partiallyOffline")}</option>
          <option value="scheduled">{t("scheduled")}</option>
          <option value="offline">{t("offline")}</option>
        </select>
      </label>
    </section>
  );
}
