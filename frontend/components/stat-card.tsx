interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: "blue" | "green" | "yellow" | "purple";
}

const COLOR_MAP = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  yellow: "bg-yellow-50 text-yellow-600",
  purple: "bg-purple-50 text-purple-600",
};

export default function StatCard({ label, value, icon, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${COLOR_MAP[color]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
