export default function TabButton({ id, label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary-400 text-primary-400'
          : 'border-transparent text-ink-400 hover:text-ink-100'
      }`}
    >
      {label}
    </button>
  );
}
