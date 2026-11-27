export default function AdminSkeletonRow({ cells }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-ink-800 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}
