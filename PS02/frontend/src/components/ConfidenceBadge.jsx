
export default function ConfidenceBadge({ confidence }) {
  const styles = {
    HIGH: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-rose-100 text-rose-700"
  };

  const level = String(confidence || "LOW").toUpperCase();

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[level] || styles.LOW
      }`}
    >
      {level} CONFIDENCE
    </span>
  );
}
