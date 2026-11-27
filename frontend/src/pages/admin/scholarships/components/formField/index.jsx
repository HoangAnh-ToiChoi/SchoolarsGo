// Một ô của form học bổng: nhãn + điều khiển
export default function FormField({ label, className, children }) {
  return (
    <div className={className}>
      <label className="inputLabel">{label}</label>
      {children}
    </div>
  );
}
