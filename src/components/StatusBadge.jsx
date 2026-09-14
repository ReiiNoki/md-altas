import { useLanguage } from "../i18n.jsx";

const statusKeys = {
  online: "online",
  offline: "offline",
  partially_offline: "partiallyOffline",
  scheduled: "scheduled",
};

export function StatusBadge({ status }) {
  const { t } = useLanguage();

  return (
    <span className={`status status--${status ?? "unknown"}`}>
      <span className="status__dot" />
      {t(statusKeys[status] ?? "unknown")}
    </span>
  );
}
