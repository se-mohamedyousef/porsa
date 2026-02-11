"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PortfolioChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="card-enhanced mb-6 p-8 text-center text-muted-foreground bg-muted/20">
        <p>📉 Not enough data for chart yet.</p>
        <p className="text-xs">Check back tomorrow to see your portfolio history!</p>
      </div>
    );
  }

  // Format data for chart
  const data = history.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-EG", {
      month: "short",
      day: "numeric",
    }),
    value: item.value,
  }));

  return (
    <div className="card-enhanced mb-6 animate-fade-in bg-white dark:bg-black/20">
      <div className="mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>📉</span> Portfolio Performance
        </h3>
        <p className="text-sm text-muted-foreground">
          Track your total portfolio value over time
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`${value.toLocaleString()} EGP`, "Value"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
