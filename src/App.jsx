import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Database, LoaderCircle, RotateCcw } from "lucide-react";
import { ArchiveStatusBar } from "./components/ArchiveStatusBar";
import { ArchiveView } from "./components/ArchiveView";
import { ActiveFilters } from "./components/ActiveFilters";
import { activeFilterEntries } from "./utils/filters";
import { FilterConsole } from "./components/FilterConsole";
import { MapWorkspace } from "./components/MapWorkspace";
import { TopBar } from "./components/TopBar";
import { ViewLoading } from "./components/ViewLoading";
import { useLanguage } from "./i18n.jsx";
import {
  expandAnalytics,
  filterEvents,
  INITIAL_FILTERS,
} from "./utils/archive";

const CalendarView = lazy(() =>
  import("./components/CalendarView").then((module) => ({ default: module.CalendarView })),
);
const DataView = lazy(() =>
  import("./components/DataView").then((module) => ({ default: module.DataView })),
);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const EMPTY_META = {
  eventCount: 0,
  missionCount: 0,
  countryCount: 0,
  yearCounts: {},
  yearRange: null,
  dataQuality: {},
  source: "Niantic official missions via Bannergress",
};

export default function App() {
  const { t } = useLanguage();
  const [archive, setArchive] = useState({ meta: EMPTY_META, events: [] });
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsState, setAnalyticsState] = useState("idle");
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsAttempt, setAnalyticsAttempt] = useState(0);
  const [eventDetails, setEventDetails] = useState({});
  const [detailLoadState, setDetailLoadState] = useState("idle");
  const [activeView, setActiveView] = useState("map");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [feedRegion, setFeedRegion] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(true);
  const [filterConsoleOpen, setFilterConsoleOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const [density, setDensity] = useState("compact");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArchive() {
      try {
        const response = await fetch(assetUrl("data/archive.json"), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setArchive(data);
        setSelectedId(data.events[0]?.id ?? null);
        setLoadState("ready");
      } catch (error) {
        if (error.name === "AbortError") return;
        setLoadError(error.message);
        setLoadState("error");
      }
    }

    loadArchive();
    return () => controller.abort();
  }, []);

  const years = useMemo(
    () =>
      Object.keys(archive.meta.yearCounts)
        .map(Number)
        .sort((a, b) => b - a),
    [archive.meta.yearCounts],
  );

  const filteredEvents = useMemo(
    () => filterEvents(archive.events, filters, deferredQuery),
    [archive.events, deferredQuery, filters],
  );

  const selectedEvent = useMemo(
    () => filteredEvents.find((event) => event.id === selectedId) ?? filteredEvents[0],
    [filteredEvents, selectedId],
  );
  const selectedEventDetail = selectedEvent
    ? (eventDetails[selectedEvent.id] ?? selectedEvent)
    : null;
  const feedEvents = useMemo(
    () =>
      filteredEvents.filter((event) => feedRegion === "all" || event.region === feedRegion),
    [feedRegion, filteredEvents],
  );

  useEffect(() => {
    if (activeView !== "archive" || !detailOpen || !selectedEvent?.detailPath) return;
    if (eventDetails[selectedEvent.id]) {
      setDetailLoadState("ready");
      return;
    }

    const controller = new AbortController();
    setDetailLoadState("loading");
    fetch(assetUrl(selectedEvent.detailPath), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Event detail request failed: ${response.status}`);
        return response.json();
      })
      .then((detail) => {
        setEventDetails((current) => ({ ...current, [selectedEvent.id]: detail }));
        setDetailLoadState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setDetailLoadState("error");
      });
    return () => controller.abort();
  }, [activeView, detailOpen, eventDetails, selectedEvent]);

  useEffect(() => {
    if (activeView !== "data" || analytics) return;
    const controller = new AbortController();
    setAnalyticsState("loading");
    fetch(assetUrl("data/analytics.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setAnalytics(expandAnalytics(data));
        setAnalyticsState("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setAnalyticsError(error.message);
        setAnalyticsState("error");
      });
    return () => controller.abort();
  }, [activeView, analytics, analyticsAttempt]);

  useEffect(() => {
    if (!filterConsoleOpen) return undefined;
    const trigger = document.activeElement;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFilterConsoleOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      trigger?.focus?.();
    };
  }, [filterConsoleOpen]);

  const updateFilter = (key, value) => {
    startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value }));
      setVisibleCount(60);
    });
  };

  const clearFilter = (key) => {
    updateFilter(key, INITIAL_FILTERS[key]);
    if (activeFilterEntries(filters).length === 1) filterButtonRef.current?.focus();
  };

  const changeView = (view) => {
    setActiveView(view);
    setFilterConsoleOpen(false);
    if (view !== "map") setFeedOpen(false);
  };

  const resetFilters = () => {
    startTransition(() => {
      setFilters(INITIAL_FILTERS);
      setVisibleCount(60);
    });
  };

  const resetFromFilterBar = () => {
    resetFilters();
    filterButtonRef.current?.focus();
  };

  const selectEvent = (id) => {
    setSelectedId(id);
    setDetailLoadState(eventDetails[id] ? "ready" : "idle");
    setDetailOpen(true);
  };

  const filteredAnalyticsEvents = useMemo(() => {
    if (!analytics?.events) return [];
    const visibleIds = new Set(filteredEvents.map((event) => event.id));
    return analytics.events.filter((event) => visibleIds.has(event.id));
  }, [analytics, filteredEvents]);

  if (loadState === "loading") {
    return (
      <main className="boot-screen">
        <LoaderCircle size={34} strokeWidth={1.1} />
        <strong>{t("establishingLink")}</strong>
        <span>{t("indexingArchive")}</span>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="boot-screen boot-screen--error">
        <Database size={34} strokeWidth={1.1} />
        <strong>{t("archiveLinkFailed")}</strong>
        <span>{t("requestErrorDetail", { detail: loadError })}</span>
        <button className="command-button" type="button" onClick={() => window.location.reload()}>
          {t("retryLink")} <RotateCcw size={16} />
        </button>
      </main>
    );
  }

  return (
    <div className="intel-shell">
      <TopBar
        activeView={activeView}
        onViewChange={changeView}
        filters={filters}
        onFilterChange={updateFilter}
        filtersOpen={filterConsoleOpen}
        onToggleFilters={() => setFilterConsoleOpen((open) => !open)}
        feedOpen={feedOpen}
        onToggleFeed={() => {
          setActiveView("map");
          setFeedOpen((open) => !open);
        }}
        activeFilterCount={activeFilterEntries(filters).length}
        filterButtonRef={filterButtonRef}
      />
      <ActiveFilters
        filters={filters}
        resultCount={filteredEvents.length}
        pending={isPending || deferredQuery !== filters.query}
        onClear={clearFilter}
        onReset={resetFromFilterBar}
      />

      <main className={`intel-workspace intel-workspace--${activeView}`}>
        {activeView === "map" ? (
          <MapWorkspace
            events={filteredEvents}
            selectedEvent={selectedEvent}
            onSelect={selectEvent}
            feedEvents={feedEvents}
            feedRegion={feedRegion}
            onFeedRegionChange={setFeedRegion}
            onOpenArchive={() => changeView("archive")}
            feedOpen={feedOpen}
            detailOpen={detailOpen}
            onCloseDetail={() => setDetailOpen(false)}
          />
        ) : null}

        {activeView === "archive" ? (
          <ArchiveView
            events={filteredEvents}
            selectedEvent={selectedEvent}
            selectedEventDetail={selectedEventDetail}
            onSelect={selectEvent}
            detailOpen={detailOpen}
            onCloseDetail={() => setDetailOpen(false)}
            detailLoadState={detailLoadState}
            density={density}
            onToggleDensity={() =>
              setDensity((current) =>
                current === "compact" ? "comfortable" : "compact",
              )
            }
            visibleCount={visibleCount}
            onLoadMore={() => setVisibleCount((count) => count + 60)}
            isPending={isPending}
            onResetFilters={resetFilters}
          />
        ) : null}

        {activeView === "calendar" ? (
          <Suspense fallback={<ViewLoading />}>
            <CalendarView events={filteredEvents} />
          </Suspense>
        ) : null}

        {activeView === "data" ? (
          analyticsState === "ready" ? (
            <Suspense fallback={<ViewLoading />}>
              <DataView
                events={filteredAnalyticsEvents}
                onSelect={(id) => {
                  selectEvent(id);
                  setActiveView("archive");
                }}
              />
            </Suspense>
          ) : (
            <ViewLoading
              label={
                analyticsState === "error"
                  ? t("analyticsLoadFailed", { detail: analyticsError })
                  : t("loadingAnalytics")
              }
              onRetry={
                analyticsState === "error"
                  ? () => {
                      setAnalyticsError("");
                      setAnalyticsAttempt((attempt) => attempt + 1);
                    }
                  : undefined
              }
            />
          )
        ) : null}

        {filterConsoleOpen ? (
          <FilterConsole
            filters={filters}
            years={years}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            onClose={() => setFilterConsoleOpen(false)}
          />
        ) : null}
      </main>

      <ArchiveStatusBar />
    </div>
  );
}
