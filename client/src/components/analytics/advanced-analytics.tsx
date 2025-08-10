import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  Package,
  Building,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";

interface AnalyticsData {
  // System-wide metrics
  totalCompanies: number;
  totalEvents: number;
  totalProducts: number;
  systemUptime: number;
  
  // Financial metrics
  totalFeesCollected: number;
  averageFeePerEvent: number;
  monthlyRevenue: number;
  
  // Performance metrics
  averageEventProcessingTime: number;
  blockchainSuccessRate: number;
  systemThroughput: number;
  
  // Time-series data
  dailyEvents: Array<{
    date: string;
    events: number;
    fees: number;
    companies: number;
  }>;
  
  // Company analytics
  companyMetrics: Array<{
    companyId: string;
    name: string;
    totalEvents: number;
    totalFees: number;
    successRate: number;
    avgProcessingTime: number;
    lastActivity: string;
  }>;
  
  // Event type distribution
  eventTypeDistribution: Array<{
    eventType: string;
    count: number;
    percentage: number;
  }>;
  
  // Geographic distribution
  geographicDistribution: Array<{
    region: string;
    companies: number;
    events: number;
  }>;
  
  // Product analytics
  productMetrics: Array<{
    productId: string;
    totalEvents: number;
    journeyLength: number;
    verificationStatus: string;
    lastUpdate: string;
  }>;
}

interface CompanyAnalyticsProps {
  companyId?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalytics({ companyId }: CompanyAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState("events");
  const [chartType, setChartType] = useState("bar");

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: companyId 
      ? ['/api/analytics/company', companyId, dateRange]
      : ['/api/analytics/system', dateRange],
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const handleExportData = async (format: 'csv' | 'json' | 'pdf') => {
    const endpoint = companyId 
      ? `/api/analytics/company/${companyId}/export`
      : '/api/analytics/system/export';
    
    const response = await fetch(`${endpoint}?format=${format}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const renderChart = (data: any[], dataKey: string, title: string) => {
    const ChartComponent = {
      bar: BarChart,
      line: LineChart,
      area: AreaChart,
    }[chartType];

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          {chartType === "bar" ? (
            <Bar dataKey={dataKey} fill="#8884d8" />
          ) : (
            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {companyId ? 'Company Analytics' : 'System Analytics'}
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            selected={dateRange}
            onSelect={(range) => range && setDateRange(range)}
          />
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Bar Chart
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4" />
                  Line Chart
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Area Chart
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalEvents?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {companyId ? 'Products Tracked' : 'Total Companies'}
            </CardTitle>
            {companyId ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyId 
                ? analyticsData?.totalProducts?.toLocaleString() || 0
                : analyticsData?.totalCompanies?.toLocaleString() || 0
              }
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analyticsData?.blockchainSuccessRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData?.totalFeesCollected?.toFixed(2) || '0.00'}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Series Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Activity Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(analyticsData?.dailyEvents || [], 'events', 'Daily Events')}
              </CardContent>
            </Card>

            {/* Event Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Event Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.eventTypeDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData?.eventTypeDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.companyMetrics?.slice(0, 5).map((company, index) => (
                  <div key={company.companyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-gray-500">
                          {company.totalEvents} events • {company.successRate}% success rate
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(company.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Processing Time</span>
                    <span className="font-medium">
                      {analyticsData?.averageEventProcessingTime?.toFixed(1) || 0}ms
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Target: &lt;500ms
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Events per Second</span>
                    <span className="font-medium">
                      {analyticsData?.systemThroughput?.toFixed(1) || 0}
                    </span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Peak: 1,250 events/sec
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Blockchain Success Rate</TableCell>
                    <TableCell>{((analyticsData?.blockchainSuccessRate || 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell>99.5%</TableCell>
                    <TableCell>
                      <Badge variant="default">Good</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average Processing Time</TableCell>
                    <TableCell>{analyticsData?.averageEventProcessingTime?.toFixed(1) || 0}ms</TableCell>
                    <TableCell>&lt;500ms</TableCell>
                    <TableCell>
                      <Badge variant="default">Good</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>System Uptime</TableCell>
                    <TableCell>{((analyticsData?.systemUptime || 0) * 100).toFixed(2)}%</TableCell>
                    <TableCell>99.9%</TableCell>
                    <TableCell>
                      <Badge variant="default">Excellent</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Total Events</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Avg Processing</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.companyMetrics?.map((company) => (
                    <TableRow key={company.companyId}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.totalEvents.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={company.successRate} className="h-2 w-16" />
                          {company.successRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>${company.totalFees.toFixed(2)}</TableCell>
                      <TableCell>{company.avgProcessingTime.toFixed(1)}ms</TableCell>
                      <TableCell>{new Date(company.lastActivity).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Journey Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Journey Length</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.productMetrics?.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-mono">{product.productId}</TableCell>
                      <TableCell>{product.totalEvents}</TableCell>
                      <TableCell>{product.journeyLength} days</TableCell>
                      <TableCell>
                        <Badge variant={product.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                          {product.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(product.lastUpdate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleExportData('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button variant="outline" onClick={() => handleExportData('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Generate comprehensive reports for compliance and analysis
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Weekly Summary</div>
                      <div className="text-sm text-gray-500">Every Monday at 9:00 AM</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Monthly Report</div>
                      <div className="text-sm text-gray-500">1st of each month</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}