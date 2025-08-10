import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Calendar, Target, Activity } from 'lucide-react';

interface PredictiveInsight {
  id: string;
  type: 'demand' | 'bottleneck' | 'quality' | 'supply';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  timeframe: string;
  recommendation: string;
  metrics: {
    current: number;
    predicted: number;
    change: number;
    unit: string;
  };
}

interface DemandForecast {
  product: string;
  currentDemand: number;
  predictedDemand: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  factors: string[];
}

interface BottleneckAnalysis {
  location: string;
  process: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  resolution: string;
  estimatedDelay: number;
}

export default function SupplyChainTransparency() {
  const [activeTab, setActiveTab] = useState('insights');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const insights: PredictiveInsight[] = [
    {
      id: '1',
      type: 'demand',
      title: 'Organic Tomato Demand Surge',
      description: 'AI models predict 45% increase in demand for organic tomatoes in the next 30 days',
      impact: 'high',
      confidence: 92,
      timeframe: '30 days',
      recommendation: 'Increase production capacity and secure additional suppliers',
      metrics: {
        current: 1500,
        predicted: 2175,
        change: 45,
        unit: 'units/week'
      }
    },
    {
      id: '2',
      type: 'bottleneck',
      title: 'Processing Facility Congestion',
      description: 'California processing center operating at 95% capacity - potential delays detected',
      impact: 'high',
      confidence: 87,
      timeframe: '7 days',
      recommendation: 'Distribute load to Arizona facility or extend operating hours',
      metrics: {
        current: 95,
        predicted: 105,
        change: 10,
        unit: '% capacity'
      }
    },
    {
      id: '3',
      type: 'quality',
      title: 'Seasonal Quality Variance',
      description: 'Temperature fluctuations may affect product quality in next 2 weeks',
      impact: 'medium',
      confidence: 78,
      timeframe: '14 days',
      recommendation: 'Implement enhanced climate control measures',
      metrics: {
        current: 96,
        predicted: 89,
        change: -7,
        unit: '% quality score'
      }
    },
    {
      id: '4',
      type: 'supply',
      title: 'Supplier Risk Assessment',
      description: 'Primary supplier shows 15% delivery delay risk due to weather patterns',
      impact: 'medium',
      confidence: 82,
      timeframe: '21 days',
      recommendation: 'Activate backup suppliers and adjust order schedules',
      metrics: {
        current: 98,
        predicted: 83,
        change: -15,
        unit: '% on-time delivery'
      }
    }
  ];

  const demandForecasts: DemandForecast[] = [
    {
      product: 'Organic Tomatoes',
      currentDemand: 1500,
      predictedDemand: 2175,
      trend: 'up',
      confidence: 92,
      factors: ['Seasonal peak', 'Marketing campaign', 'Supply shortage']
    },
    {
      product: 'Free-Range Chicken',
      currentDemand: 850,
      predictedDemand: 765,
      trend: 'down',
      confidence: 85,
      factors: ['Price increase', 'Competitor launch', 'Economic factors']
    },
    {
      product: 'Organic Apples',
      currentDemand: 2200,
      predictedDemand: 2290,
      trend: 'up',
      confidence: 79,
      factors: ['Health trends', 'Harvest season', 'Export demand']
    },
    {
      product: 'Grass-Fed Beef',
      currentDemand: 650,
      predictedDemand: 640,
      trend: 'stable',
      confidence: 88,
      factors: ['Steady market', 'Consistent quality', 'Loyal customer base']
    }
  ];

  const bottlenecks: BottleneckAnalysis[] = [
    {
      location: 'California Processing Center',
      process: 'Quality Inspection',
      severity: 'critical',
      impact: '2-day delay for 40% of shipments',
      resolution: 'Add 2 additional inspection stations',
      estimatedDelay: 48
    },
    {
      location: 'Texas Distribution Hub',
      process: 'Cold Storage',
      severity: 'high',
      impact: '12-hour delay for temperature-sensitive products',
      resolution: 'Upgrade refrigeration capacity',
      estimatedDelay: 12
    },
    {
      location: 'Oregon Farm Network',
      process: 'Harvesting',
      severity: 'medium',
      impact: '6-hour delay due to weather dependency',
      resolution: 'Implement weather-resistant harvesting equipment',
      estimatedDelay: 6
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered insights for demand forecasting and bottleneck identification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={selectedTimeframe === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottleneck Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        {insight.type === 'demand' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {insight.type === 'bottleneck' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {insight.type === 'quality' && <Target className="h-4 w-4 text-blue-500" />}
                        {insight.type === 'supply' && <Activity className="h-4 w-4 text-purple-500" />}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <Badge variant={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.timeframe}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Current: {insight.metrics.current} {insight.metrics.unit}</span>
                        <span>Predicted: {insight.metrics.predicted} {insight.metrics.unit}</span>
                      </div>
                      <Progress value={insight.confidence} className="h-2" />
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <span className="text-xs font-medium">{insight.confidence}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Change:</span>
                        <span className={`text-sm font-bold ${insight.metrics.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {insight.metrics.change >= 0 ? '+' : ''}{insight.metrics.change}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <div className="grid gap-4">
            {demandForecasts.map((forecast, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{forecast.product}</CardTitle>
                      {getTrendIcon(forecast.trend)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {forecast.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{forecast.currentDemand}</div>
                      <div className="text-sm text-muted-foreground">Current Demand</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{forecast.predictedDemand}</div>
                      <div className="text-sm text-muted-foreground">Predicted Demand</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        forecast.predictedDemand > forecast.currentDemand ? 'text-green-600' : 
                        forecast.predictedDemand < forecast.currentDemand ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {forecast.predictedDemand > forecast.currentDemand ? '+' : ''}
                        {((forecast.predictedDemand - forecast.currentDemand) / forecast.currentDemand * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Change</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {forecast.factors.map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="grid gap-4">
            {bottlenecks.map((bottleneck, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-lg">{bottleneck.location}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(bottleneck.severity)}`} />
                      <Badge variant="outline" className="text-xs">
                        {bottleneck.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Process: {bottleneck.process}</div>
                      <div className="text-sm text-muted-foreground">Impact: {bottleneck.impact}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Estimated Delay: {bottleneck.estimatedDelay} hours
                      </div>
                      <Progress value={(bottleneck.estimatedDelay / 48) * 100} className="h-2" />
                    </div>
                  </div>

                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Resolution:</strong> {bottleneck.resolution}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}