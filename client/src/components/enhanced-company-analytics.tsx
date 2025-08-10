import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Package, 
  Shield, 
  CheckCircle, 
  AlertTriangle
} from 'lucide-react';

interface EnhancedAnalyticsProps {
  companyId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  target?: number;
}

interface GeographicData {
  location: string;
  events: number;
  packages: number;
  verificationRate: number;
}

interface PartnerMetric {
  name: string;
  eventsProcessed: number;
  verificationRate: number;
  avgResponseTime: number;
  status: 'active' | 'pending' | 'inactive';
}

interface SeasonalTrend {
  period: string;
  events: number;
  packages: number;
  verificationRate: number;
}

interface ComplianceMetric {
  standard: string;
  score: number;
  lastAudit: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  requirements: string[];
}

export default function EnhancedCompanyAnalytics({ companyId }: EnhancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('performance');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('transparency');

  // Mock comprehensive analytics data
  const performanceMetrics: PerformanceMetric[] = [
    { name: 'Transparency Score', value: 96, previousValue: 92, trend: 'up', unit: '%', target: 95 },
    { name: 'Verification Rate', value: 98, previousValue: 97, trend: 'up', unit: '%', target: 95 },
    { name: 'Consumer Engagement', value: 87, previousValue: 82, trend: 'up', unit: '%', target: 80 },
    { name: 'Supply Chain Efficiency', value: 94, previousValue: 96, trend: 'down', unit: '%', target: 90 },
    { name: 'Compliance Score', value: 99, previousValue: 98, trend: 'up', unit: '%', target: 95 },
    { name: 'Partner Satisfaction', value: 92, previousValue: 89, trend: 'up', unit: '%', target: 85 }
  ];

  const geographicData: GeographicData[] = [
    { location: 'Montana', events: 156, packages: 45, verificationRate: 98 },
    { location: 'Colorado', events: 234, packages: 67, verificationRate: 96 },
    { location: 'Wyoming', events: 89, packages: 23, verificationRate: 100 },
    { location: 'Nebraska', events: 123, packages: 34, verificationRate: 97 },
    { location: 'Kansas', events: 67, packages: 18, verificationRate: 94 }
  ];

  const partnerMetrics: PartnerMetric[] = [
    { name: 'Heritage Organic Ranch', eventsProcessed: 156, verificationRate: 98, avgResponseTime: 2.3, status: 'active' },
    { name: 'Elite Meat Processing', eventsProcessed: 234, verificationRate: 96, avgResponseTime: 1.8, status: 'active' },
    { name: 'Fresh Pack Solutions', eventsProcessed: 189, verificationRate: 97, avgResponseTime: 2.1, status: 'active' },
    { name: 'Premium Cold Storage', eventsProcessed: 123, verificationRate: 95, avgResponseTime: 3.2, status: 'pending' },
    { name: 'Rapid Distribution', eventsProcessed: 87, verificationRate: 94, avgResponseTime: 2.7, status: 'active' }
  ];

  const seasonalTrends: SeasonalTrend[] = [
    { period: 'Q1 2024', events: 1234, packages: 456, verificationRate: 94 },
    { period: 'Q2 2024', events: 1456, packages: 523, verificationRate: 96 },
    { period: 'Q3 2024', events: 1678, packages: 598, verificationRate: 98 },
    { period: 'Q4 2024', events: 1523, packages: 487, verificationRate: 97 }
  ];

  const complianceMetrics: ComplianceMetric[] = [
    { 
      standard: 'USDA Organic', 
      score: 98, 
      lastAudit: '2025-01-10', 
      status: 'compliant',
      requirements: ['Organic Certificate', 'Soil Testing', 'Inspection Report']
    },
    { 
      standard: 'HACCP', 
      score: 96, 
      lastAudit: '2025-01-05', 
      status: 'compliant',
      requirements: ['Critical Control Points', 'Monitoring Records', 'Corrective Actions']
    },
    { 
      standard: 'ISO 22000', 
      score: 94, 
      lastAudit: '2024-12-20', 
      status: 'compliant',
      requirements: ['Food Safety Management', 'Prerequisite Programs', 'Communication']
    },
    { 
      standard: 'BRC Global Standard', 
      score: 89, 
      lastAudit: '2024-12-15', 
      status: 'warning',
      requirements: ['Site Standards', 'Product Control', 'Process Control']
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'inactive': return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'compliant': return <Badge className="bg-green-500">Compliant</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'non-compliant': return <Badge className="bg-red-500">Non-Compliant</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const calculatePerformanceScore = () => {
    const avgScore = performanceMetrics.reduce((sum, metric) => sum + metric.value, 0) / performanceMetrics.length;
    return Math.round(avgScore);
  };

  const getTopPerformingLocation = () => {
    return geographicData.reduce((best, current) => 
      current.verificationRate > best.verificationRate ? current : best
    );
  };

  const getAverageVerificationRate = () => {
    const avgRate = seasonalTrends.reduce((sum, trend) => sum + trend.verificationRate, 0) / seasonalTrends.length;
    return Math.round(avgRate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your supply chain performance and operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{calculatePerformanceScore()}%</div>
            <p className="text-xs text-muted-foreground">
              Across all metrics
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTopPerformingLocation().location}</div>
            <p className="text-xs text-muted-foreground">
              {getTopPerformingLocation().verificationRate}% verification rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageVerificationRate()}%</div>
            <p className="text-xs text-muted-foreground">
              Quarterly average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerMetrics.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Verified partners
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4">
            {performanceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <Badge variant={metric.value >= (metric.target || 0) ? 'default' : 'destructive'}>
                        {metric.value >= (metric.target || 0) ? 'On Target' : 'Below Target'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{metric.value}{metric.unit}</div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Previous: {metric.previousValue}{metric.unit}</div>
                      <div className={`text-sm font-medium ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} 
                        {Math.abs(metric.value - metric.previousValue)}{metric.unit}
                      </div>
                    </div>
                  </div>
                  {metric.target && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Target: {metric.target}{metric.unit}</span>
                        <span>{((metric.value / metric.target) * 100).toFixed(1)}% of target</span>
                      </div>
                      <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <div className="grid gap-4">
            {geographicData.map((location) => (
              <Card key={location.location}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      {location.location}
                    </CardTitle>
                    <Badge variant={location.verificationRate >= 95 ? 'default' : 'secondary'}>
                      {location.verificationRate}% Verified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{location.events}</div>
                      <div className="text-xs text-muted-foreground">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{location.packages}</div>
                      <div className="text-xs text-muted-foreground">Packages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{location.verificationRate}%</div>
                      <div className="text-xs text-muted-foreground">Verification</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <div className="grid gap-4">
            {partnerMetrics.map((partner) => (
              <Card key={partner.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(partner.status)}
                      <Badge variant="outline">{partner.eventsProcessed} Events</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{partner.verificationRate}%</div>
                      <div className="text-xs text-muted-foreground">Verification Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{partner.avgResponseTime}h</div>
                      <div className="text-xs text-muted-foreground">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{partner.eventsProcessed}</div>
                      <div className="text-xs text-muted-foreground">Events Processed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            {seasonalTrends.map((trend) => (
              <Card key={trend.period}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      {trend.period}
                    </CardTitle>
                    <Badge variant="outline">{trend.verificationRate}% Verified</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{trend.events}</div>
                      <div className="text-xs text-muted-foreground">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{trend.packages}</div>
                      <div className="text-xs text-muted-foreground">Packages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{trend.verificationRate}%</div>
                      <div className="text-xs text-muted-foreground">Verified</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4">
            {complianceMetrics.map((compliance) => (
              <Card key={compliance.standard}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-green-500" />
                      {compliance.standard}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(compliance.status)}
                      <Badge variant="outline">{compliance.score}%</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Audit: {new Date(compliance.lastAudit).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Compliance Score</span>
                      <span className="text-lg font-bold">{compliance.score}%</span>
                    </div>
                    <Progress value={compliance.score} className="h-2" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Requirements:</div>
                      <div className="flex flex-wrap gap-1">
                        {compliance.requirements.map((req, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}