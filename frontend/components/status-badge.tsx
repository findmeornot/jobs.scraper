type Status = "pending" | "confirmed" | "rejected";

interface StatusBadgeProps {
  confirmedAt?: string | null;
  rejectedAt?: string | null;
}

export default function StatusBadge({ confirmedAt, rejectedAt }: StatusBadgeProps) {
  const status: Status = confirmedAt ? "confirmed" : rejectedAt ? "rejected" : "pending";

  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels = { pending: "Pending", confirmed: "Confirmed", rejected: "Rejected" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
