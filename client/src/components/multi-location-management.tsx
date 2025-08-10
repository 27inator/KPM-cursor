import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Building, Users, TrendingUp, Activity, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: 'headquarters' | 'franchise' | 'distributor' | 'warehouse' | 'retail';
  address: string;
  manager: string;
  status: 'active' | 'inactive' | 'pending';
  metrics: {
    revenue: number;
    orders: number;
    inventory: number;
    employees: number;
    satisfaction: number;
  };
  compliance: {
    score: number;
    issues: number;
    lastAudit: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface PerformanceMetric {
  locationId: string;
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface CoordinationTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  deadline: string;
  locations: string[];
  progress: number;
}

export default function MultiLocationManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const locations: Location[] = [
    {
      id: '1',
      name: 'California HQ',
      type: 'headquarters',
      address: '123 Main St, San Francisco, CA 94105',
      manager: 'Sarah Johnson',
      status: 'active',
      metrics: {
        revenue: 2500000,
        orders: 1250,
        inventory: 95,
        employees: 45,
        satisfaction: 4.8
      },
      compliance: {
        score: 95,
        issues: 2,
        lastAudit: '2024-12-15'
      },
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
      id: '2',
      name: 'Texas Franchise',
      type: 'franchise',
      address: '456 Oak Ave, Austin, TX 78701',
      manager: 'Michael Chen',
      status: 'active',
      metrics: {
        revenue: 1800000,
        orders: 890,
        inventory: 87,
        employees: 32,
        satisfaction: 4.6
      },
      compliance: {
        score: 88,
        issues: 5,
        lastAudit: '2024-11-20'
      },
      coordinates: { lat: 30.2672, lng: -97.7431 }
    },
    {
      id: '3',
      name: 'Florida Distribution',
      type: 'distributor',
      address: '789 Palm Blvd, Miami, FL 33101',
      manager: 'Lisa Rodriguez',
      status: 'active',
      metrics: {
        revenue: 950000,
        orders: 450,
        inventory: 78,
        employees: 18,
        satisfaction: 4.3
      },
      compliance: {
        score: 92,
        issues: 3,
        lastAudit: '2024-12-01'
      },
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
    {
      id: '4',
      name: 'New York Warehouse',
      type: 'warehouse',
      address: '321 Industrial Dr, Brooklyn, NY 11201',
      manager: 'David Wilson',
      status: 'active',
      metrics: {
        revenue: 0,
        orders: 2100,
        inventory: 92,
        employees: 25,
        satisfaction: 4.4
      },
      compliance: {
        score: 85,
        issues: 7,
        lastAudit: '2024-10-30'
      },
      coordinates: { lat: 40.6892, lng: -73.9442 }
    },
    {
      id: '5',
      name: 'Seattle Retail',
      type: 'retail',
      address: '654 Pine St, Seattle, WA 98101',
      manager: 'Jennifer Kim',
      status: 'pending',
      metrics: {
        revenue: 650000,
        orders: 320,
        inventory: 65,
        employees: 12,
        satisfaction: 4.2
      },
      compliance: {
        score: 78,
        issues: 12,
        lastAudit: '2024-09-15'
      },
      coordinates: { lat: 47.6062, lng: -122.3321 }
    }
  ];

  const performanceMetrics: PerformanceMetric[] = [
    { locationId: '1', metric: 'Revenue Growth', value: 15, target: 12, trend: 'up', period: 'Monthly' },
    { locationId: '1', metric: 'Order Fulfillment', value: 98, target: 95, trend: 'up', period: 'Weekly' },
    { locationId: '2', metric: 'Customer Satisfaction', value: 4.6, target: 4.5, trend: 'up', period: 'Monthly' },
    { locationId: '2', metric: 'Inventory Turnover', value: 87, target: 85, trend: 'stable', period: 'Monthly' },
    { locationId: '3', metric: 'Distribution Efficiency', value: 92, target: 90, trend: 'up', period: 'Weekly' },
    { locationId: '3', metric: 'Cost per Unit', value: 2.3, target: 2.5, trend: 'down', period: 'Monthly' },
    { locationId: '4', metric: 'Storage Utilization', value: 92, target: 85, trend: 'up', period: 'Daily' },
    { locationId: '4', metric: 'Processing Speed', value: 145, target: 120, trend: 'up', period: 'Daily' },
    { locationId: '5', metric: 'Foot Traffic', value: 320, target: 400, trend: 'down', period: 'Daily' },
    { locationId: '5', metric: 'Conversion Rate', value: 12, target: 15, trend: 'down', period: 'Weekly' }
  ];

  const coordinationTasks: CoordinationTask[] = [
    {
      id: '1',
      title: 'Q1 Inventory Synchronization',
      description: 'Align inventory levels across all locations for Q1 planning',
      assignedTo: ['Sarah Johnson', 'Michael Chen', 'Lisa Rodriguez'],
      priority: 'high',
      status: 'in-progress',
      deadline: '2025-01-31',
      locations: ['1', '2', '3', '4'],
      progress: 65
    },
    {
      id: '2',
      title: 'New Product Launch Coordination',
      description: 'Coordinate launch of organic berry line across franchise network',
      assignedTo: ['Sarah Johnson', 'Jennifer Kim'],
      priority: 'medium',
      status: 'pending',
      deadline: '2025-02-15',
      locations: ['1', '2', '5'],
      progress: 20
    },
    {
      id: '3',
      title: 'Compliance Training Rollout',
      description: 'Deploy new food safety training program to all locations',
      assignedTo: ['David Wilson', 'Lisa Rodriguez'],
      priority: 'high',
      status: 'in-progress',
      deadline: '2025-01-25',
      locations: ['1', '2', '3', '4', '5'],
      progress: 80
    },
    {
      id: '4',
      title: 'Supply Chain Optimization',
      description: 'Optimize delivery routes and reduce transportation costs',
      assignedTo: ['Michael Chen', 'David Wilson'],
      priority: 'medium',
      status: 'completed',
      deadline: '2025-01-15',
      locations: ['2', '3', '4'],
      progress: 100
    }
  ];

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'headquarters': return <Building className="h-4 w-4 text-blue-500" />;
      case 'franchise': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'distributor': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'warehouse': return <Building className="h-4 w-4 text-purple-500" />;
      case 'retail': return <MapPin className="h-4 w-4 text-red-500" />;
      default: return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive': return <Badge className="bg-red-500">Inactive</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateOverallPerformance = () => {
    const totalRevenue = locations.reduce((sum, loc) => sum + loc.metrics.revenue, 0);
    const totalOrders = locations.reduce((sum, loc) => sum + loc.metrics.orders, 0);
    const avgSatisfaction = locations.reduce((sum, loc) => sum + loc.metrics.satisfaction, 0) / locations.length;
    
    return {
      totalRevenue,
      totalOrders,
      avgSatisfaction,
      activeLocations: locations.filter(loc => loc.status === 'active').length
    };
  };

  const overall = calculateOverallPerformance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Multi-Location Management</h2>
          <p className="text-muted-foreground">
            Coordinate operations across franchise and distributor networks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(overall.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Across {overall.activeLocations} active locations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Monthly processing volume
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall.avgSatisfaction.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coordinationTasks.filter(task => task.status === 'in-progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Coordination tasks in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Locations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {locations.map((location) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLocationTypeIcon(location.type)}
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(location.status)}
                      <Badge variant="outline" className="text-xs capitalize">
                        {location.type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Manager: {location.manager}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.metrics.employees} employees
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Compliance Score: {location.compliance.score}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {location.compliance.issues} issues pending
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {location.metrics.revenue > 0 ? `$${(location.metrics.revenue / 1000000).toFixed(1)}M` : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{location.metrics.orders}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{location.metrics.inventory}%</div>
                      <div className="text-xs text-muted-foreground">Inventory</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{location.metrics.satisfaction}</div>
                      <div className="text-xs text-muted-foreground">Satisfaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4">
            {locations.map((location) => {
              const locationMetrics = performanceMetrics.filter(m => m.locationId === location.id);
              return (
                <Card key={location.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getLocationTypeIcon(location.type)}
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {locationMetrics.length} metrics
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {locationMetrics.map((metric, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(metric.trend)}
                            <span className="text-sm font-medium">{metric.metric}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{metric.value} / {metric.target}</span>
                            <Badge variant="outline" className="text-xs">
                              {metric.period}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={(metric.value / metric.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-4">
          <div className="grid gap-4">
            {coordinationTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTaskStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Assigned To:</div>
                      <div className="flex flex-wrap gap-1">
                        {task.assignedTo.map((person, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Locations:</div>
                      <div className="flex flex-wrap gap-1">
                        {task.locations.map((locationId, idx) => {
                          const location = locations.find(l => l.id === locationId);
                          return (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {location?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>

                  {task.status === 'pending' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Task is pending approval from location managers before execution.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}