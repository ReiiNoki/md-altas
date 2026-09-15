import { lazy, Suspense } from "react";
import { useLanguage } from "../i18n.jsx";
import { displayCityName } from "../utils/locations";
import { EventDetail } from "./EventDetail";
import { EventFeed } from "./EventFeed";
import { ViewLoading } from "./ViewLoading";

const MissionMap = lazy(() =>
  import("./MissionMap").then((module) => ({ default: module.MissionMap })),
);

export function MapWorkspace({
  events,
  selectedEvent,
  onSelect,
  feedEvents,
  feedRegion,
  onFeedRegionChange,
  onOpenArchive,
  feedOpen,
  detailOpen,
  onCloseDetail,
}) {
  const { formatNumber, language, t } = useLanguage();

  return (
    <>
      <Suspense fallback={<ViewLoading label={t("loadingMap")} />}>
        <MissionMap
          events={events}
          selectedEvent={selectedEvent}
          onSelect={onSelect}
        />
      </Suspense>

      {selectedEvent ? (
        <div className="selection-strip">
          <i />
          <strong title={selectedEvent.city}>{displayCityName(selectedEvent.countryCode, selectedEvent.city, language)}</strong>
          <span>/</span>
          <time>{selectedEvent.date ?? t("dateUnknown")}</time>
          <span>/</span>
          <b>
            {selectedEvent.missionCount != null
              ? `${formatNumber(selectedEvent.missionCount)} ${t("missions")}`
              : t("unknownMissionCount")}
          </b>
          <span>/</span>
          <b>
            {typeof selectedEvent.averageRating === "number"
              ? `${selectedEvent.averageRating.toFixed(1)}%`
              : t("noRating")}
          </b>
        </div>
      ) : null}

      <EventFeed
        events={feedEvents}
        region={feedRegion}
        onRegionChange={onFeedRegionChange}
        onSelect={onSelect}
        onOpenArchive={onOpenArchive}
        open={feedOpen}
      />

      <EventDetail
        event={selectedEvent}
        open={detailOpen}
        onClose={onCloseDetail}
        compact
      />
    </>
  );
}
