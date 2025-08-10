import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Building, Users } from "lucide-react";

interface CompanyAnalyticsData {
  id: number;
  companyId: string;
  name: string;
  analytics: {
    companyId: string;
    period: number;
    totalFees: number;
    totalTransactions: number;
    avgFeePerTransaction: number;
    dailyFees: Record<string, number>;
    feesByEventType: Record<string, number>;
    chartData: Array<{ date: string; fees: number }>;
  };
  recentTransactions: Array<{
    id: number;
    txid: string;
    type: string;
    eventType: string;
    tagId: string;
    amount: number;
    fee: number;
    status: string;
    createdAt: string;
    eventId: string;
  }>;
}

interface WalletMetrics {
  masterWalletBalance: number;
  totalFeesSpent: number;
  totalFeesSpentUsd: number;
  activeCompanies: number;
  eventsToday: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DashboardAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const { data: companiesAnalytics, isLoading: analyticsLoading } = useQuery<CompanyAnalyticsData[]>({
    queryKey: [`/api/companies/analytics`, selectedPeriod],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<WalletMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (analyticsLoading || metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Aggregate data for system-wide analytics
  const totalSystemFees = companiesAnalytics?.reduce((sum, company) => sum + company.analytics.totalFees, 0) || 0;
  const totalSystemTransactions = companiesAnalytics?.reduce((sum, company) => sum + company.analytics.totalTransactions, 0) || 0;
  const avgSystemFeePerTransaction = totalSystemTransactions > 0 ? totalSystemFees / totalSystemTransactions : 0;

  // Create combined daily fees chart data
  const combinedDailyFees = companiesAnalytics?.reduce((combined, company) => {
    Object.entries(company.analytics.dailyFees).forEach(([date, fees]) => {
      if (!combined[date]) combined[date] = 0;
      combined[date] += fees;
    });
    return combined;
  }, {} as Record<string, number>) || {};

  const systemChartData = Object.entries(combinedDailyFees)
    .map(([date, fees]) => ({ date, fees }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Create company comparison data
  const companyComparisonData = companiesAnalytics?.map(company => ({
    name: company.name,
    totalFees: company.analytics.totalFees,
    transactions: company.analytics.totalTransactions,
    avgFee: company.analytics.avgFeePerTransaction
  })) || [];

  // Aggregate event types across all companies
  const systemEventTypes = companiesAnalytics?.reduce((combined, company) => {
    Object.entries(company.analytics.feesByEventType).forEach(([eventType, fees]) => {
      if (!combined[eventType]) combined[eventType] = 0;
      combined[eventType] += fees;
    });
    return combined;
  }, {} as Record<string, number>) || {};

  const eventTypePieData = Object.entries(systemEventTypes).map(([type, fees]) => ({
    name: type,
    value: fees,
    percentage: Math.round((fees / totalSystemFees) * 100)
  }));

  // Calculate activity trends
  const recentActivity = companiesAnalytics?.reduce((activity, company) => {
    company.recentTransactions.forEach(tx => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      if (!activity[date]) activity[date] = 0;
      activity[date] += 1;
    });
    return activity;
  }, {} as Record<string, number>) || {};

  const activityChartData = Object.entries(recentActivity)
    .map(([date, count]) => ({ date, transactions: count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <p className="text-gray-600">Comprehensive overview of blockchain activity and fee analytics</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSystemFees.toFixed(4)} KAS</div>
            <div className="text-xs text-muted-foreground">
              ${(totalSystemFees * 0.75).toFixed(2)} USD
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSystemTransactions}</div>
            <div className="text-xs text-muted-foreground">
              Blockchain commits
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fee/Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSystemFeePerTransaction.toFixed(6)} KAS</div>
            <div className="text-xs text-muted-foreground">
              System average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companiesAnalytics?.length || 0}</div>
            <div className="text-xs text-muted-foreground">
              With recent activity
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System-wide Daily Fee Spending */}
        <Card>
          <CardHeader>
            <CardTitle>System-wide Daily Fee Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={systemChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(6)} KAS`, 'Total Fees']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="fees" 
                  stroke="#8884d8" 
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Transaction Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value, 'Transactions']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={{ fill: '#00C49F' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>System Event Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(6)} KAS`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Company Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Company Fee Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(6)} KAS`, 'Total Fees']}
                />
                <Bar dataKey="totalFees" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume vs Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume vs Fee Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={companyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'transactions' ? value : `${value.toFixed(6)} KAS`,
                  name === 'transactions' ? 'Transactions' : 'Total Fees'
                ]}
              />
              <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="totalFees" stroke="#ff7300" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}