import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import { EventDetail } from "./EventDetail";
import { MissionImage } from "./MissionImage";
import { StatusBadge } from "./StatusBadge";
import { useLanguage } from "../i18n.jsx";
import { displayCityName, displayCountryName } from "../utils/locations";

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthCells(year, month) {
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({
      key: `empty-start-${index}`,
      day: null,
    })),
    ...Array.from({ length: dayCount }, (_, index) => ({
      key: `day-${index + 1}`,
      day: index + 1,
    })),
  ];
  while (cells.length % 7) cells.push({ key: `empty-end-${cells.length}`, day: null });
  return cells;
}

function formatAgendaDate(date, locale, t) {
  if (!date) return t("noActivityThisMonth");
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function CalendarView({ events }) {
  const { locale, formatNumber, language, t } = useLanguage();
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
          new Date(Date.UTC(2024, month, 1)),
        ),
      ),
    [locale],
  );
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
          new Date(Date.UTC(2024, 0, day + 1)),
        ),
      ),
    [locale],
  );
  const datedEvents = useMemo(
    () => events.filter((event) => event.date && Number.isFinite(event.year)),
    [events],
  );
  const years = useMemo(
    () => [...new Set(datedEvents.map((event) => event.year))].sort((a, b) => b - a),
    [datedEvents],
  );
  const latestEvent = useMemo(
    () => [...datedEvents].sort((a, b) => b.date.localeCompare(a.date))[0],
    [datedEvents],
  );
  const [requestedYear, setRequestedYear] = useState(null);
  const [requestedMonth, setRequestedMonth] = useState(null);
  const [requestedDate, setRequestedDate] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [activityDetails, setActivityDetails] = useState({});
  const [activityDetailStates, setActivityDetailStates] = useState({});
  const [wheelDirection, setWheelDirection] = useState(null);
  const wheelLockedRef = useRef(false);
  const wheelTimerRef = useRef(null);

  const requestedYearAvailable = years.includes(requestedYear);
  const activeYear = requestedYearAvailable ? requestedYear : latestEvent?.year;
  const latestMonth = latestEvent ? Number(latestEvent.date.slice(5, 7)) - 1 : 0;
  const activeMonth =
    requestedYearAvailable &&
    Number.isInteger(requestedMonth) &&
    requestedMonth >= 0 &&
    requestedMonth < 12
      ? requestedMonth
      : latestMonth;

  const eventsByDate = useMemo(() => {
    const groups = new Map();
    for (const event of datedEvents) {
      if (event.year !== activeYear || Number(event.date.slice(5, 7)) - 1 !== activeMonth) {
        continue;
      }
      const group = groups.get(event.date) ?? [];
      group.push(event);
      groups.set(event.date, group);
    }
    return groups;
  }, [activeMonth, activeYear, datedEvents]);

  const dates = [...eventsByDate.keys()].sort((a, b) => b.localeCompare(a));
  const activeDate = eventsByDate.has(requestedDate) ? requestedDate : (dates[0] ?? null);
  const agendaEvents = activeDate ? (eventsByDate.get(activeDate) ?? []) : [];
  const selectedActivity =
    agendaEvents.find((event) => event.id === selectedActivityId) ?? null;
  const selectedActivityDetail = selectedActivity
    ? (activityDetails[selectedActivity.id] ?? selectedActivity)
    : null;
  const selectedActivityState = selectedActivity
    ? (activityDetailStates[selectedActivity.id] ?? "idle")
    : "idle";
  const activeYearIndex = years.indexOf(activeYear);
  const canGoPrevious = activeMonth > 0 || activeYearIndex < years.length - 1;
  const canGoNext = activeMonth < 11 || activeYearIndex > 0;
  const undatedCount = events.length - datedEvents.length;
  const today = new Date().toISOString().slice(0, 10);

  const changePeriod = (year, month) => {
    setRequestedYear(year);
    setRequestedMonth(month);
    setRequestedDate(null);
  };

  const moveMonth = (direction) => {
    let year = activeYear;
    let month = activeMonth + direction;
    if (month < 0) {
      year = years[activeYearIndex + 1];
      month = 11;
    } else if (month > 11) {
      year = years[activeYearIndex - 1];
      month = 0;
    }
    if (Number.isFinite(year)) changePeriod(year, month);
  };

  const changeYear = (year) => {
    const monthsWithEvents = datedEvents
      .filter((event) => event.year === year)
      .map((event) => Number(event.date.slice(5, 7)) - 1);
    changePeriod(year, Math.max(...monthsWithEvents));
  };

  const handleCalendarWheel = (event) => {
    if (Math.abs(event.deltaY) < 10) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    if ((direction < 0 && !canGoPrevious) || (direction > 0 && !canGoNext)) return;
    event.preventDefault();
    if (wheelLockedRef.current) return;

    wheelLockedRef.current = true;
    setWheelDirection(direction > 0 ? "next" : "previous");
    moveMonth(direction);
    wheelTimerRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false;
      setWheelDirection(null);
    }, 320);
  };

  useEffect(
    () => () => {
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!selectedActivity?.detailPath || activityDetails[selectedActivity.id]) return;
    const controller = new AbortController();
    setActivityDetailStates((current) => ({
      ...current,
      [selectedActivity.id]: "loading",
    }));
    const url = `${import.meta.env.BASE_URL}${selectedActivity.detailPath.replace(/^\/+/, "")}`;
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Activity detail request failed: ${response.status}`);
        return response.json();
      })
      .then((detail) => {
        setActivityDetails((current) => ({ ...current, [selectedActivity.id]: detail }));
        setActivityDetailStates((current) => ({
          ...current,
          [selectedActivity.id]: "ready",
        }));
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setActivityDetailStates((current) => ({
          ...current,
          [selectedActivity.id]: "error",
        }));
      });
    return () => controller.abort();
  }, [activityDetails, selectedActivity]);

  if (!years.length) {
    return (
      <section className="calendar-view">
        <div className="empty-state">
          <CalendarDays size={24} />
          <strong>{t("noDatedEvents")}</strong>
          <p>{t("noDatedEventsDescription")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="calendar-view">
      <div className="surface-heading calendar-heading">
        <div>
          <span className="section-code">{t("archiveCalendar")}</span>
          <h1>{t("missionDayCalendar")}</h1>
        </div>
        <div className="calendar-period-control" aria-label={t("selectYearMonth")}>
          <button
            type="button"
            aria-label={t("previousMonth")}
            disabled={!canGoPrevious}
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <select value={activeYear} onChange={(event) => changeYear(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={activeMonth}
            onChange={(event) => changePeriod(activeYear, Number(event.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label={t("nextMonth")}
            disabled={!canGoNext}
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="calendar-split">
        <section
          className={`calendar-panel ${wheelDirection ? `is-wheel-${wheelDirection}` : ""}`}
          aria-label={`${months[activeMonth]} ${activeYear}`}
          onWheel={handleCalendarWheel}
        >
          <header className="calendar-panel__heading">
            <div>
              <span>{activeYear}</span>
              <h2>{months[activeMonth]}</h2>
            </div>
            <span className="calendar-panel__meta">
              <strong>{formatNumber([...eventsByDate.values()].flat().length)} {t("events")}</strong>
              <small>{t("scrollToChangeMonth")}</small>
            </span>
          </header>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="calendar-days">
            {monthCells(activeYear, activeMonth).map(({ key, day }) => {
              if (!day) return <span className="calendar-day is-empty" key={key} />;
              const date = isoDate(activeYear, activeMonth, day);
              const dayEvents = eventsByDate.get(date) ?? [];
              if (!dayEvents.length) {
                return (
                  <span className={`calendar-day ${date === today ? "is-today" : ""}`} key={key}>
                    <span>{day}</span>
                  </span>
                );
              }

              const locations = dayEvents.map((event) => displayCityName(event.countryCode, event.city, language)).join(", ");
              return (
                <button
                  className={`calendar-day has-events ${date === activeDate ? "is-selected" : ""} ${date === today ? "is-today" : ""}`}
                  type="button"
                  key={key}
                  title={t("calendarDayTitle", {
                    count: formatNumber(dayEvents.length),
                    locations,
                  })}
                  aria-label={t("calendarDayEvents", {
                    date,
                    count: formatNumber(dayEvents.length),
                    locations,
                  })}
                  onClick={() => setRequestedDate(date)}
                >
                  <span>{day}</span>
                  <span className="calendar-day__cities">
                    {dayEvents.map((event) => (
                      <span key={event.id} title={event.city}>{displayCityName(event.countryCode, event.city, language)}</span>
                    ))}
                  </span>
                  <b>{formatNumber(dayEvents.length)}</b>
                </button>
              );
            })}
          </div>
          {undatedCount ? (
            <p className="calendar-undated">{formatNumber(undatedCount)} {t("noConfirmedDate")}</p>
          ) : null}
        </section>

        <section
          className={`calendar-activity-panel ${selectedActivity ? "has-detail" : ""}`}
          aria-live="polite"
        >
          {selectedActivity ? (
            <EventDetail
              event={selectedActivityDetail}
              open
              loading={selectedActivityState === "loading"}
              loadError={selectedActivityState === "error"}
              onClose={() => setSelectedActivityId(null)}
            />
          ) : (
            <>
              <header>
                <span>{t("activitySchedule")}</span>
                <h2>{formatAgendaDate(activeDate, locale, t)}</h2>
                <small>{formatNumber(agendaEvents.length)} {t("missionDayEvents")}</small>
              </header>

              <div className="calendar-activity-list">
            {!agendaEvents.length ? (
              <div className="calendar-activity-empty">
                <CalendarDays size={26} strokeWidth={1.2} />
                <strong>{t("noActivity")}</strong>
                <p>{t("selectHighlightedDate")}</p>
              </div>
            ) : null}
            {agendaEvents.map((event, index) => (
              <button
                className="calendar-activity-card"
                type="button"
                key={event.id}
                onClick={() => setSelectedActivityId(event.id)}
              >
                <MissionImage event={event} eager={index < 2} />
                <span className="calendar-activity-card__main">
                  <small>
                    <MapPin size={11} /> {displayCountryName(event.countryCode, event.country, language)}
                  </small>
                  <strong title={event.city}>{displayCityName(event.countryCode, event.city, language)}</strong>
                  <span>{event.title}</span>
                </span>
                <span className="calendar-activity-card__metrics">
                  <b>
                    {event.missionCount != null
                      ? `${formatNumber(event.missionCount)} ${t("missions")}`
                      : t("unknownMissionCount")}
                  </b>
                  <b>
                    <Star size={11} fill="currentColor" />
                    {typeof event.averageRating === "number"
                      ? `${event.averageRating.toFixed(1)}%`
                      : t("noRating")}
                  </b>
                  <b>
                    <Users size={11} />
                    {event.completions != null ? formatNumber(event.completions) : t("noRating")}
                  </b>
                </span>
                <StatusBadge status={event.status} />
                <ChevronRight className="calendar-activity-card__arrow" size={17} />
              </button>
            ))}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
