import { CalendarRange, Database } from "lucide-react";
import { useLanguage } from "../i18n.jsx";

export function ArchiveStatusBar({ coverage, resultCount }) {
  const { formatNumber, t } = useLanguage();

  return (
    <footer className="intel-statusbar">
      <span className="intel-statusbar__source">
        <Database size={11} />
        <small className="intel-statusbar__source-label" title={t("source")}>{t("source")}</small>
        <a href={`${import.meta.env.BASE_URL}city-name-credits.html`} target="_blank" rel="noreferrer">
          {t("cityNameSources")}
        </a>
      </span>
      <span>
        <CalendarRange size={11} />
        {t("coverage")}{t("labelSeparator")}{coverage ? `${coverage.min} — ${coverage.max}` : t("noRating")}
      </span>
      <span>
        {t("results")}{t("labelSeparator")}<strong>{formatNumber(resultCount)}</strong>
      </span>
      <span className="intel-statusbar__online">
        <i />
        {t("archiveLoaded")}
      </span>
    </footer>
  );
}
