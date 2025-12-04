import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GenreData {
  hommes: number;
  femmes: number;
}

interface GenreDonutChartProps {
  data: GenreData;
  titre: string;
}

export default function GenreDonutChart({ data, titre }: GenreDonutChartProps) {
  const total = data.hommes + data.femmes;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnee disponible
      </div>
    );
  }

  const chartData = [
    { name: 'Femmes', value: data.femmes, color: '#ec4899' },
    { name: 'Hommes', value: data.hommes, color: '#3b82f6' },
  ];

  const pourcentageFemmes = ((data.femmes / total) * 100).toFixed(1);
  const pourcentageHommes = ((data.hommes / total) * 100).toFixed(1);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {titre}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 text-sm mt-2">
        <div className="text-center">
          <span className="font-semibold text-pink-600">{pourcentageFemmes}%</span>
          <span className="text-gray-500 ml-1">femmes</span>
        </div>
        <div className="text-center">
          <span className="font-semibold text-blue-600">{pourcentageHommes}%</span>
          <span className="text-gray-500 ml-1">hommes</span>
        </div>
      </div>
    </div>
  );
}
