import { ListFilter } from "lucide-react";
import { useLanguage } from "../i18n.jsx";
import { EventDetail } from "./EventDetail";
import { EventTable } from "./EventTable";

export function ArchiveView({
  events,
  selectedEvent,
  selectedEventDetail,
  onSelect,
  detailOpen,
  onCloseDetail,
  detailLoadState,
  density,
  onToggleDensity,
  visibleCount,
  onLoadMore,
  isPending,
  onResetFilters,
}) {
  const { formatNumber, t } = useLanguage();

  return (
    <section className="archive-screen">
      <header className="intel-surface-heading">
        <div>
          <span>{t("archiveDatabase")}</span>
          <h1>{t("archiveIndex")}</h1>
        </div>
        <div className="archive-tools">
          <strong>{formatNumber(events.length)} {t("events")}</strong>
          <button
            type="button"
            className={density === "compact" ? "is-active" : ""}
            onClick={onToggleDensity}
          >
            <ListFilter size={16} />
            {t("density")}
          </button>
        </div>
      </header>
      <div className={`archive-layout ${detailOpen ? "" : "detail-closed"}`}>
        <div className={`primary-surface ${isPending ? "is-pending" : ""}`}>
          <EventTable
            events={events}
            selectedId={selectedEvent?.id}
            onSelect={onSelect}
            density={density}
            visibleCount={visibleCount}
            onLoadMore={onLoadMore}
            onResetFilters={onResetFilters}
          />
        </div>
        <EventDetail
          event={selectedEventDetail}
          open={detailOpen}
          loading={detailLoadState === "loading"}
          loadError={detailLoadState === "error"}
          onClose={onCloseDetail}
        />
      </div>
    </section>
  );
}
