import { useEffect, useRef, useState } from "react";
import {
  Languages,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLanguage } from "../i18n.jsx";

const views = [
  { id: "map", label: "map" },
  { id: "archive", label: "archive" },
  { id: "calendar", label: "calendar" },
  { id: "data", label: "data" },
];

export function TopBar({
  activeView,
  onViewChange,
  filters,
  onFilterChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount = 0,
  filterButtonRef,
}) {
  const { language, toggleLanguage, t } = useLanguage();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const searchToggleRef = useRef(null);
  const searchVisible = searchExpanded || filters.query.length > 0;

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  const toggleSearch = () => {
    if (filters.query) {
      searchInputRef.current?.focus();
    } else {
      setSearchExpanded((expanded) => !expanded);
    }
  };

  return (
    <header className={`intel-topbar ${searchVisible ? "has-search" : ""}`}>
      <button
        className="intel-brand"
        type="button"
        aria-label={`MD Atlas — ${t("backToMap")}`}
        title={t("brandDescription")}
        onClick={() => onViewChange("map")}
      >
        <img
          className="intel-brand__mark"
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          aria-hidden="true"
        />
        <span className="intel-brand__text">
          <strong>MD Atlas</strong>
          <small>{t("brandDescription")}</small>
        </span>
      </button>

      <nav className="intel-tabs" aria-label={t("mainViews")}>
        {views.map((view) => (
          <button
            type="button"
            key={view.id}
            className={activeView === view.id ? "is-active" : ""}
            aria-current={activeView === view.id ? "page" : undefined}
            onClick={() => onViewChange(view.id)}
          >
            {t(view.label)}
          </button>
        ))}
      </nav>

      <button
        ref={searchToggleRef}
        className="icon-button intel-search-toggle"
        type="button"
        aria-label={t(
          filters.query ? "editSearch" : searchVisible ? "closeSearch" : "openSearch",
        )}
        aria-expanded={searchVisible}
        aria-controls="archive-search"
        onClick={toggleSearch}
      >
        {searchVisible && !filters.query ? <X size={18} /> : <Search size={18} />}
      </button>

      <div className="intel-search" id="archive-search" role="search">
        <Search size={17} strokeWidth={1.4} aria-hidden="true" />
        <label className="sr-only" htmlFor="archive-search-input">
          {t("searchPlaceholder")}
        </label>
        <input
          ref={searchInputRef}
          id="archive-search-input"
          value={filters.query}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" &&
              !filters.query &&
              searchToggleRef.current?.getClientRects().length
            ) {
              event.stopPropagation();
              setSearchExpanded(false);
              searchToggleRef.current.focus();
            }
          }}
          onChange={(event) => onFilterChange("query", event.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        {filters.query ? (
          <button
            type="button"
            title={t("clearSearch")}
            aria-label={t("clearSearch")}
            onClick={() => {
              setSearchExpanded(true);
              onFilterChange("query", "");
              searchInputRef.current?.focus();
            }}
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <button
        ref={filterButtonRef}
        className="intel-tool-button"
        type="button"
        title={t("openFilters")}
        aria-label={t("openFilters")}
        aria-expanded={filtersOpen}
        aria-controls="filter-console"
        onClick={onToggleFilters}
      >
        <SlidersHorizontal size={18} strokeWidth={1.35} />
        {activeFilterCount ? <span>{activeFilterCount}</span> : null}
      </button>

      <button
        className="intel-language-button"
        type="button"
        title={t("switchLanguage")}
        aria-label={t("language")}
        aria-pressed={language === "en"}
        onClick={toggleLanguage}
      >
        <Languages size={16} strokeWidth={1.35} />
        <span>{t("alternateLanguageShort")}</span>
      </button>
    </header>
  );
}
