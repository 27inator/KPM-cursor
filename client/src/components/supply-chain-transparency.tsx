import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, MapPin, Clock, CheckCircle, AlertTriangle, TrendingUp, Package, Shield, Search } from 'lucide-react';

interface ProductCategory {
  id: string;
  categoryName: string;
  description: string;
  totalPackages: number;
  avgTransparencyScore: number;
  verifiedPackages: number;
  totalBlockchainProofs: number;
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high';
  avgConsumerTrust: number;
  packages: ProductPackage[];
}

interface ProductPackage {
  id: string;
  categoryId: string;
  packageId: string;
  barcode: string;
  productName: string;
  batchNumber: string;
  transparencyScore: number;
  completeness: number;
  verificationStatus: 'verified' | 'pending' | 'incomplete';
  supplyChainSteps: number;
  blockchainProofs: number;
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high';
  consumerTrust: number;
  qrCodeGenerated: boolean;
  consumerScans: number;
}

interface TraceabilityInsight {
  id: string;
  type: 'gap' | 'improvement' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  affectedProducts: string[];
  actionable: boolean;
  priority: number;
}

interface SupplyChainVisibility {
  stageId: string;
  stageName: string;
  location: string;
  participants: number;
  documentsUploaded: number;
  blockchainCommits: number;
  visibilityScore: number;
  averageDelay: number;
  lastActivity: string;
  criticalPath: boolean;
}

export default function SupplyChainTransparency() {
  const [activeTab, setActiveTab] = useState('transparency');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const transparencyMetrics: TransparencyMetric[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      productName: 'Organic Cherry Tomatoes',
      transparencyScore: 94,
      completeness: 89,
      verificationStatus: 'verified',
      supplyChainSteps: 8,
      blockchainProofs: 7,
      lastUpdated: '2025-01-17T10:30:00Z',
      riskLevel: 'low',
      consumerTrust: 92
    },
    {
      id: '2',
      productId: 'prod_chicken_002',
      productName: 'Free-Range Chicken',
      transparencyScore: 87,
      completeness: 82,
      verificationStatus: 'verified',
      supplyChainSteps: 6,
      blockchainProofs: 5,
      lastUpdated: '2025-01-17T09:45:00Z',
      riskLevel: 'medium',
      consumerTrust: 88
    },
    {
      id: '3',
      productId: 'prod_apple_003',
      productName: 'Gala Apples',
      transparencyScore: 76,
      completeness: 71,
      verificationStatus: 'incomplete',
      supplyChainSteps: 5,
      blockchainProofs: 3,
      lastUpdated: '2025-01-17T11:00:00Z',
      riskLevel: 'high',
      consumerTrust: 74
    },
    {
      id: '4',
      productId: 'prod_salmon_004',
      productName: 'Wild Salmon',
      transparencyScore: 91,
      completeness: 95,
      verificationStatus: 'verified',
      supplyChainSteps: 9,
      blockchainProofs: 8,
      lastUpdated: '2025-01-17T08:15:00Z',
      riskLevel: 'low',
      consumerTrust: 96
    }
  ];

  const traceabilityInsights: TraceabilityInsight[] = [
    {
      id: '1',
      type: 'gap',
      title: 'Missing Transportation Data',
      description: 'Transportation stage has 23% less documentation than other stages',
      impact: 'high',
      recommendation: 'Implement mandatory GPS tracking and temperature monitoring during transport',
      affectedProducts: ['prod_chicken_002', 'prod_apple_003'],
      actionable: true,
      priority: 1
    },
    {
      id: '2',
      type: 'improvement',
      title: 'Enhanced Blockchain Verification',
      description: 'Organic products show 15% higher consumer trust with complete blockchain proofs',
      impact: 'medium',
      recommendation: 'Prioritize blockchain commits for all organic certification events',
      affectedProducts: ['prod_organic_tomato_001'],
      actionable: true,
      priority: 2
    },
    {
      id: '3',
      type: 'risk',
      title: 'Supply Chain Bottleneck',
      description: 'Processing facility shows 2-day average delay in documentation',
      impact: 'high',
      recommendation: 'Implement real-time event logging at processing facilities',
      affectedProducts: ['prod_apple_003', 'prod_salmon_004'],
      actionable: true,
      priority: 1
    },
    {
      id: '4',
      type: 'opportunity',
      title: 'Consumer Engagement Potential',
      description: 'Products with >90% transparency score generate 25% more consumer engagement',
      impact: 'medium',
      recommendation: 'Create consumer-facing transparency dashboards for high-scoring products',
      affectedProducts: ['prod_organic_tomato_001', 'prod_salmon_004'],
      actionable: true,
      priority: 3
    }
  ];

  const visibilityStages: SupplyChainVisibility[] = [
    {
      stageId: 'harvest',
      stageName: 'Harvest/Origin',
      location: 'Farm/Source',
      participants: 45,
      documentsUploaded: 234,
      blockchainCommits: 198,
      visibilityScore: 92,
      averageDelay: 0.5,
      lastActivity: '2025-01-17T11:30:00Z',
      criticalPath: true
    },
    {
      stageId: 'processing',
      stageName: 'Processing',
      location: 'Processing Facility',
      participants: 23,
      documentsUploaded: 187,
      blockchainCommits: 156,
      visibilityScore: 78,
      averageDelay: 2.1,
      lastActivity: '2025-01-17T10:45:00Z',
      criticalPath: true
    },
    {
      stageId: 'quality',
      stageName: 'Quality Control',
      location: 'QC Lab',
      participants: 12,
      documentsUploaded: 298,
      blockchainCommits: 287,
      visibilityScore: 96,
      averageDelay: 0.3,
      lastActivity: '2025-01-17T11:15:00Z',
      criticalPath: false
    },
    {
      stageId: 'packaging',
      stageName: 'Packaging',
      location: 'Packaging Center',
      participants: 18,
      documentsUploaded: 156,
      blockchainCommits: 134,
      visibilityScore: 85,
      averageDelay: 1.2,
      lastActivity: '2025-01-17T10:20:00Z',
      criticalPath: false
    },
    {
      stageId: 'distribution',
      stageName: 'Distribution',
      location: 'Distribution Center',
      participants: 34,
      documentsUploaded: 89,
      blockchainCommits: 67,
      visibilityScore: 69,
      averageDelay: 3.4,
      lastActivity: '2025-01-17T09:30:00Z',
      criticalPath: true
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge className="bg-red-500">Needs Improvement</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return <Badge className="bg-green-500">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-red-500">High Risk</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'gap': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'improvement': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const averageTransparency = transparencyMetrics.reduce((sum, m) => sum + m.transparencyScore, 0) / transparencyMetrics.length;
  const verifiedProducts = transparencyMetrics.filter(m => m.verificationStatus === 'verified').length;
  const totalBlockchainProofs = transparencyMetrics.reduce((sum, m) => sum + m.blockchainProofs, 0);
  const averageConsumerTrust = transparencyMetrics.reduce((sum, m) => sum + m.consumerTrust, 0) / transparencyMetrics.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supply Chain Transparency</h2>
          <p className="text-muted-foreground">
            Advanced transparency analytics for supply chain visibility and traceability
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search Products</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Transparency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageTransparency)}`}>
              {averageTransparency.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedProducts}</div>
            <p className="text-xs text-muted-foreground">
              Out of {transparencyMetrics.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Proofs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBlockchainProofs}</div>
            <p className="text-xs text-muted-foreground">
              Verified on blockchain
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumer Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageConsumerTrust)}`}>
              {averageConsumerTrust.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average trust score
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transparency">Transparency Metrics</TabsTrigger>
          <TabsTrigger value="insights">Traceability Insights</TabsTrigger>
          <TabsTrigger value="visibility">Supply Chain Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="transparency" className="space-y-4">
          <div className="grid gap-4">
            {transparencyMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{metric.productName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getScoreBadge(metric.transparencyScore)}
                      {getRiskBadge(metric.riskLevel)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Product ID: {metric.productId}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.transparencyScore)}`}>
                        {metric.transparencyScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Transparency</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.completeness)}`}>
                        {metric.completeness}%
                      </div>
                      <div className="text-xs text-muted-foreground">Completeness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{metric.blockchainProofs}</div>
                      <div className="text-xs text-muted-foreground">Proofs</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.consumerTrust)}`}>
                        {metric.consumerTrust}%
                      </div>
                      <div className="text-xs text-muted-foreground">Trust Score</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Supply Chain Steps Documented</span>
                      <span>{metric.blockchainProofs}/{metric.supplyChainSteps}</span>
                    </div>
                    <Progress value={(metric.blockchainProofs / metric.supplyChainSteps) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last Updated: {new Date(metric.lastUpdated).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm">
                        Improve Score
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {traceabilityInsights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority {insight.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Recommendation:</div>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Affected Products:</div>
                    <div className="flex flex-wrap gap-1">
                      {insight.affectedProducts.map((productId, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {productId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Type: {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {insight.actionable && (
                        <Button size="sm">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visibility" className="space-y-4">
          <div className="grid gap-4">
            {visibilityStages.map((stage) => (
              <Card key={stage.stageId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-lg">{stage.stageName}</CardTitle>
                      {stage.criticalPath && <Badge variant="destructive" className="text-xs">Critical Path</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getScoreBadge(stage.visibilityScore)}
                      {stage.averageDelay > 2 && <Badge variant="destructive" className="text-xs">Delayed</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Location: {stage.location}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(stage.visibilityScore)}`}>
                        {stage.visibilityScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Visibility</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stage.participants}</div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stage.documentsUploaded}</div>
                      <div className="text-xs text-muted-foreground">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stage.blockchainCommits}</div>
                      <div className="text-xs text-muted-foreground">Blockchain</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Blockchain Commitment Rate</span>
                      <span>{((stage.blockchainCommits / stage.documentsUploaded) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(stage.blockchainCommits / stage.documentsUploaded) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Avg Delay: {stage.averageDelay} days | Last Activity: {new Date(stage.lastActivity).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Stage
                      </Button>
                      <Button size="sm">
                        Optimize
                      </Button>
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