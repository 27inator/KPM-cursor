import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Droplets, Factory, Truck, Award, TrendingUp, Calendar, Download } from 'lucide-react';

interface SustainabilityMetrics {
  id: string;
  category: 'carbon' | 'water' | 'waste' | 'energy' | 'social';
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  trend: 'improving' | 'stable' | 'declining';
  impact: 'high' | 'medium' | 'low';
  description: string;
}

interface CarbonFootprint {
  product: string;
  totalEmissions: number;
  breakdown: {
    farming: number;
    processing: number;
    transportation: number;
    packaging: number;
    retail: number;
  };
  reductionTarget: number;
  currentProgress: number;
}

interface ESGReport {
  category: string;
  score: number;
  maxScore: number;
  criteria: {
    name: string;
    score: number;
    maxScore: number;
    status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  }[];
  recommendations: string[];
}

export default function SustainabilityScoring() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('all');

  const sustainabilityMetrics: SustainabilityMetrics[] = [
    {
      id: '1',
      category: 'carbon',
      name: 'Carbon Footprint',
      value: 2.4,
      unit: 'kg CO2e/unit',
      benchmark: 3.2,
      trend: 'improving',
      impact: 'high',
      description: 'Total greenhouse gas emissions per product unit'
    },
    {
      id: '2',
      category: 'water',
      name: 'Water Usage',
      value: 15.2,
      unit: 'liters/unit',
      benchmark: 18.5,
      trend: 'improving',
      impact: 'medium',
      description: 'Total water consumption in production cycle'
    },
    {
      id: '3',
      category: 'waste',
      name: 'Waste Reduction',
      value: 8.3,
      unit: '% waste',
      benchmark: 12.0,
      trend: 'improving',
      impact: 'medium',
      description: 'Percentage of production waste generated'
    },
    {
      id: '4',
      category: 'energy',
      name: 'Renewable Energy',
      value: 67,
      unit: '% renewable',
      benchmark: 50,
      trend: 'stable',
      impact: 'high',
      description: 'Percentage of renewable energy usage'
    },
    {
      id: '5',
      category: 'social',
      name: 'Fair Trade Score',
      value: 92,
      unit: 'points',
      benchmark: 85,
      trend: 'improving',
      impact: 'high',
      description: 'Social responsibility and fair trade compliance'
    }
  ];

  const carbonFootprints: CarbonFootprint[] = [
    {
      product: 'Organic Tomatoes',
      totalEmissions: 2.1,
      breakdown: {
        farming: 0.8,
        processing: 0.3,
        transportation: 0.6,
        packaging: 0.2,
        retail: 0.2
      },
      reductionTarget: 15,
      currentProgress: 23
    },
    {
      product: 'Free-Range Chicken',
      totalEmissions: 4.2,
      breakdown: {
        farming: 2.1,
        processing: 0.8,
        transportation: 0.7,
        packaging: 0.3,
        retail: 0.3
      },
      reductionTarget: 20,
      currentProgress: 12
    },
    {
      product: 'Organic Apples',
      totalEmissions: 1.8,
      breakdown: {
        farming: 0.7,
        processing: 0.2,
        transportation: 0.5,
        packaging: 0.2,
        retail: 0.2
      },
      reductionTarget: 10,
      currentProgress: 31
    }
  ];

  const esgReports: ESGReport[] = [
    {
      category: 'Environmental',
      score: 78,
      maxScore: 100,
      criteria: [
        { name: 'Carbon Emissions', score: 85, maxScore: 100, status: 'good' },
        { name: 'Water Conservation', score: 92, maxScore: 100, status: 'excellent' },
        { name: 'Waste Management', score: 76, maxScore: 100, status: 'good' },
        { name: 'Biodiversity', score: 63, maxScore: 100, status: 'needs-improvement' }
      ],
      recommendations: [
        'Implement advanced carbon capture technologies',
        'Expand biodiversity conservation programs',
        'Invest in circular economy initiatives'
      ]
    },
    {
      category: 'Social',
      score: 85,
      maxScore: 100,
      criteria: [
        { name: 'Labor Rights', score: 95, maxScore: 100, status: 'excellent' },
        { name: 'Community Impact', score: 88, maxScore: 100, status: 'good' },
        { name: 'Product Safety', score: 92, maxScore: 100, status: 'excellent' },
        { name: 'Consumer Rights', score: 67, maxScore: 100, status: 'needs-improvement' }
      ],
      recommendations: [
        'Enhance consumer education programs',
        'Strengthen community engagement initiatives',
        'Implement comprehensive consumer feedback systems'
      ]
    },
    {
      category: 'Governance',
      score: 82,
      maxScore: 100,
      criteria: [
        { name: 'Transparency', score: 88, maxScore: 100, status: 'good' },
        { name: 'Ethics', score: 95, maxScore: 100, status: 'excellent' },
        { name: 'Risk Management', score: 79, maxScore: 100, status: 'good' },
        { name: 'Compliance', score: 67, maxScore: 100, status: 'needs-improvement' }
      ],
      recommendations: [
        'Enhance regulatory compliance monitoring',
        'Implement advanced risk assessment tools',
        'Strengthen board diversity and independence'
      ]
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'carbon': return <Factory className="h-4 w-4" />;
      case 'water': return <Droplets className="h-4 w-4" />;
      case 'waste': return <Leaf className="h-4 w-4" />;
      case 'energy': return <Leaf className="h-4 w-4" />;
      case 'social': return <Award className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'stable': return 'text-blue-500';
      case 'declining': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateOverallScore = () => {
    const total = sustainabilityMetrics.reduce((sum, metric) => {
      const score = metric.value > metric.benchmark ? 100 : (metric.value / metric.benchmark) * 100;
      return sum + score;
    }, 0);
    return Math.round(total / sustainabilityMetrics.length);
  };

  const generateReport = () => {
    // In a real implementation, this would generate a PDF report
    alert('ESG Report generation initiated. Report will be available for download in 2-3 minutes.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sustainability Scoring</h2>
          <p className="text-muted-foreground">
            Carbon footprint tracking and ESG reporting dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={generateReport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateOverallScore()}/100</div>
            <p className="text-xs text-muted-foreground">
              Based on 5 key sustainability metrics
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Carbon Reduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">-18%</div>
            <p className="text-xs text-muted-foreground">
              Compared to last year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ESG Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">82%</div>
            <p className="text-xs text-muted-foreground">
              Regulatory requirements met
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Metrics Overview</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
          <TabsTrigger value="esg">ESG Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {sustainabilityMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(metric.category)}
                      <CardTitle className="text-lg">{metric.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
                      <Badge variant="outline" className="text-xs">
                        {metric.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Current: {metric.value} {metric.unit}</span>
                        <span>Benchmark: {metric.benchmark} {metric.unit}</span>
                      </div>
                      <Progress 
                        value={metric.value > metric.benchmark ? 100 : (metric.value / metric.benchmark) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Performance:</span>
                        <span className={`text-sm font-bold ${
                          metric.value < metric.benchmark ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {metric.value < metric.benchmark ? 'Above Target' : 'Below Target'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Trend:</span>
                        <span className={`text-sm capitalize ${getTrendColor(metric.trend)}`}>
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="carbon" className="space-y-4">
          <div className="grid gap-4">
            {carbonFootprints.map((footprint, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Factory className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-lg">{footprint.product}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {footprint.totalEmissions} kg CO2e
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        -{footprint.reductionTarget}% target
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(footprint.breakdown).map(([stage, value]) => (
                      <div key={stage} className="text-center">
                        <div className="text-sm font-semibold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">{stage}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Reduction Progress</span>
                      <span>{footprint.currentProgress}% of {footprint.reductionTarget}% target</span>
                    </div>
                    <Progress value={(footprint.currentProgress / footprint.reductionTarget) * 100} className="h-2" />
                  </div>

                  <Alert>
                    <Leaf className="h-4 w-4" />
                    <AlertDescription>
                      Focus on transportation and farming stages for maximum emission reduction impact.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="esg" className="space-y-4">
          <div className="grid gap-4">
            {esgReports.map((report, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{report.category}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.score}/{report.maxScore} points
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Score</span>
                      <span>{report.score}/{report.maxScore}</span>
                    </div>
                    <Progress value={(report.score / report.maxScore) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Criteria Breakdown:</div>
                    {report.criteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(criterion.status)}`} />
                          <span className="text-sm">{criterion.name}</span>
                        </div>
                        <span className="text-sm">{criterion.score}/{criterion.maxScore}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommendations:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
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