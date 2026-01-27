import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, PieChart as PieIcon } from "lucide-react";

const revenueData = [
  { name: "Jan", income: 4000 },
  { name: "Feb", income: 3000 },
  { name: "Mar", income: 2000 },
  { name: "Apr", income: 2780 },
  { name: "May", income: 1890 },
  { name: "Jun", income: 2390 },
  { name: "Jul", income: 3490 },
];

const conversionData = [
  { name: "Mon", views: 120, contacts: 12 },
  { name: "Tue", views: 132, contacts: 15 },
  { name: "Wed", views: 101, contacts: 8 },
  { name: "Thu", views: 154, contacts: 20 },
  { name: "Fri", views: 190, contacts: 25 },
  { name: "Sat", views: 230, contacts: 35 },
  { name: "Sun", views: 210, contacts: 30 },
];

const serviceData = [
  { name: "Cleaning", value: 400 },
  { name: "Repair", value: 300 },
  { name: "Install", value: 300 },
  { name: "Consult", value: 200 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdvancedMetrics({ provider }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Revenue Trend */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Revenue Trajectory
          </CardTitle>
          <CardDescription className="text-slate-400">
            Monthly income trend (Last 7 Months)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `฿${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic vs Conversion */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-400" />
              Conversion Funnel
            </CardTitle>
            <CardDescription className="text-slate-400">
              Profile Views vs. Contact Requests (Weekly)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                <Bar
                  dataKey="views"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Views"
                />
                <Bar
                  dataKey="contacts"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Contacts"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Mix */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Service Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Earnings by service category
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
