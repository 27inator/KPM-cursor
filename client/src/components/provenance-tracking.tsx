import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Route, MapPin, Clock, CheckCircle, AlertTriangle, QrCode, Link, Shield } from 'lucide-react';

interface ProvenanceRecord {
  id: string;
  productId: string;
  productName: string;
  category: string;
  totalSteps: number;
  completedSteps: number;
  blockchainAnchors: number;
  currentStage: string;
  originVerified: boolean;
  authenticity: 'verified' | 'pending' | 'disputed';
  traceabilityScore: number;
  lastUpdated: string;
  consumerAccess: boolean;
  qrCodeGenerated: boolean;
}

interface ProvenanceJourney {
  stepId: string;
  stepName: string;
  location: string;
  timestamp: string;
  participant: string;
  eventType: string;
  verified: boolean;
  blockchainTxId: string;
  documentation: string[];
  nextStep: string | null;
  criticalControlPoint: boolean;
}

interface AuthenticityCheck {
  id: string;
  productId: string;
  checkType: 'origin' | 'quality' | 'certification' | 'handling';
  result: 'passed' | 'failed' | 'pending';
  confidence: number;
  verificationMethod: string;
  timestamp: string;
  evidenceCount: number;
  blockchainProof: string;
  notes: string;
}

export default function ProvenanceTracking() {
  const [activeTab, setActiveTab] = useState('records');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const provenanceRecords: ProvenanceRecord[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      productName: 'Organic Cherry Tomatoes',
      category: 'Produce',
      totalSteps: 8,
      completedSteps: 7,
      blockchainAnchors: 6,
      currentStage: 'Retail Distribution',
      originVerified: true,
      authenticity: 'verified',
      traceabilityScore: 94,
      lastUpdated: '2025-01-17T10:30:00Z',
      consumerAccess: true,
      qrCodeGenerated: true
    },
    {
      id: '2',
      productId: 'prod_chicken_002',
      productName: 'Free-Range Chicken',
      category: 'Poultry',
      totalSteps: 6,
      completedSteps: 5,
      blockchainAnchors: 4,
      currentStage: 'Processing',
      originVerified: true,
      authenticity: 'verified',
      traceabilityScore: 87,
      lastUpdated: '2025-01-17T09:45:00Z',
      consumerAccess: false,
      qrCodeGenerated: false
    },
    {
      id: '3',
      productId: 'prod_salmon_003',
      productName: 'Wild Salmon',
      category: 'Seafood',
      totalSteps: 9,
      completedSteps: 8,
      blockchainAnchors: 7,
      currentStage: 'Quality Control',
      originVerified: true,
      authenticity: 'verified',
      traceabilityScore: 96,
      lastUpdated: '2025-01-17T11:00:00Z',
      consumerAccess: true,
      qrCodeGenerated: true
    },
    {
      id: '4',
      productId: 'prod_coffee_004',
      productName: 'Fair Trade Coffee',
      category: 'Beverages',
      totalSteps: 7,
      completedSteps: 4,
      blockchainAnchors: 3,
      currentStage: 'Farm Origin',
      originVerified: false,
      authenticity: 'pending',
      traceabilityScore: 65,
      lastUpdated: '2025-01-17T08:15:00Z',
      consumerAccess: false,
      qrCodeGenerated: false
    }
  ];

  const provenanceJourney: ProvenanceJourney[] = [
    {
      stepId: 'step_1',
      stepName: 'Farm Origin',
      location: 'Organic Farm, California',
      timestamp: '2025-01-10T06:00:00Z',
      participant: 'Green Valley Farms',
      eventType: 'HARVEST',
      verified: true,
      blockchainTxId: '0xa1b2c3d4e5f6789...',
      documentation: ['Organic Certificate', 'Soil Test Results', 'Harvest Report'],
      nextStep: 'step_2',
      criticalControlPoint: true
    },
    {
      stepId: 'step_2',
      stepName: 'Initial Processing',
      location: 'Processing Center, California',
      timestamp: '2025-01-11T08:30:00Z',
      participant: 'FreshPack Processing',
      eventType: 'PROCESS',
      verified: true,
      blockchainTxId: '0xb2c3d4e5f6789a1...',
      documentation: ['Processing Log', 'Temperature Records', 'Quality Check'],
      nextStep: 'step_3',
      criticalControlPoint: true
    },
    {
      stepId: 'step_3',
      stepName: 'Quality Control',
      location: 'QC Lab, California',
      timestamp: '2025-01-12T10:15:00Z',
      participant: 'Quality Assurance Lab',
      eventType: 'QC',
      verified: true,
      blockchainTxId: '0xc3d4e5f6789a1b2...',
      documentation: ['Lab Results', 'Safety Certification', 'Quality Grade'],
      nextStep: 'step_4',
      criticalControlPoint: true
    },
    {
      stepId: 'step_4',
      stepName: 'Packaging',
      location: 'Packaging Facility, California',
      timestamp: '2025-01-13T14:20:00Z',
      participant: 'EcoPack Solutions',
      eventType: 'PACKAGE',
      verified: true,
      blockchainTxId: '0xd4e5f6789a1b2c3...',
      documentation: ['Packaging Materials', 'Batch Numbers', 'Labeling Records'],
      nextStep: 'step_5',
      criticalControlPoint: false
    },
    {
      stepId: 'step_5',
      stepName: 'Cold Storage',
      location: 'Cold Storage, California',
      timestamp: '2025-01-14T16:45:00Z',
      participant: 'ColdChain Logistics',
      eventType: 'STORAGE',
      verified: true,
      blockchainTxId: '0xe5f6789a1b2c3d4...',
      documentation: ['Temperature Logs', 'Storage Duration', 'Inventory Records'],
      nextStep: 'step_6',
      criticalControlPoint: false
    },
    {
      stepId: 'step_6',
      stepName: 'Transportation',
      location: 'En Route to Distribution',
      timestamp: '2025-01-15T09:00:00Z',
      participant: 'FreshTransport Inc',
      eventType: 'SHIP',
      verified: true,
      blockchainTxId: '0xf6789a1b2c3d4e5...',
      documentation: ['GPS Tracking', 'Temperature Monitoring', 'Chain of Custody'],
      nextStep: 'step_7',
      criticalControlPoint: false
    },
    {
      stepId: 'step_7',
      stepName: 'Distribution Center',
      location: 'Regional Distribution, Nevada',
      timestamp: '2025-01-16T11:30:00Z',
      participant: 'Regional Distribution Co',
      eventType: 'RECEIVE',
      verified: true,
      blockchainTxId: '0x789a1b2c3d4e5f6...',
      documentation: ['Receipt Verification', 'Inventory Update', 'Quality Inspection'],
      nextStep: 'step_8',
      criticalControlPoint: false
    },
    {
      stepId: 'step_8',
      stepName: 'Retail Distribution',
      location: 'Retail Stores, Multiple Locations',
      timestamp: '2025-01-17T10:30:00Z',
      participant: 'Retail Partners',
      eventType: 'RETAIL',
      verified: false,
      blockchainTxId: '',
      documentation: ['Delivery Confirmation', 'Store Placement'],
      nextStep: null,
      criticalControlPoint: false
    }
  ];

  const authenticityChecks: AuthenticityCheck[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      checkType: 'origin',
      result: 'passed',
      confidence: 98,
      verificationMethod: 'GPS + Blockchain',
      timestamp: '2025-01-17T10:30:00Z',
      evidenceCount: 3,
      blockchainProof: '0xa1b2c3d4e5f6789...',
      notes: 'Farm location verified, organic certification confirmed'
    },
    {
      id: '2',
      productId: 'prod_organic_tomato_001',
      checkType: 'quality',
      result: 'passed',
      confidence: 95,
      verificationMethod: 'Lab Analysis + QC',
      timestamp: '2025-01-17T10:25:00Z',
      evidenceCount: 5,
      blockchainProof: '0xc3d4e5f6789a1b2...',
      notes: 'All quality parameters within acceptable range'
    },
    {
      id: '3',
      productId: 'prod_organic_tomato_001',
      checkType: 'certification',
      result: 'passed',
      confidence: 100,
      verificationMethod: 'Certificate Verification',
      timestamp: '2025-01-17T10:20:00Z',
      evidenceCount: 2,
      blockchainProof: '0xa1b2c3d4e5f6789...',
      notes: 'USDA Organic certification valid and verified'
    },
    {
      id: '4',
      productId: 'prod_chicken_002',
      checkType: 'handling',
      result: 'pending',
      confidence: 85,
      verificationMethod: 'Temperature Monitoring',
      timestamp: '2025-01-17T09:45:00Z',
      evidenceCount: 4,
      blockchainProof: '',
      notes: 'Cold chain maintained, final verification pending'
    }
  ];

  const getAuthenticityBadge = (authenticity: string) => {
    switch (authenticity) {
      case 'verified': return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'disputed': return <Badge className="bg-red-500">Disputed</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'passed': return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed': return <Badge className="bg-red-500">Failed</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const generateQRCode = (productId: string) => {
    alert(`QR code generated for product ${productId}`);
  };

  const viewJourney = (productId: string) => {
    setSelectedProduct(productId);
    setActiveTab('journey');
  };

  const verifiedRecords = provenanceRecords.filter(r => r.authenticity === 'verified').length;
  const avgTraceabilityScore = provenanceRecords.reduce((sum, r) => sum + r.traceabilityScore, 0) / provenanceRecords.length;
  const totalBlockchainAnchors = provenanceRecords.reduce((sum, r) => sum + r.blockchainAnchors, 0);
  const consumerAccessible = provenanceRecords.filter(r => r.consumerAccess).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Provenance Tracking</h2>
          <p className="text-muted-foreground">
            Complete product journey tracking with blockchain verification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2">
            <QrCode className="h-4 w-4" />
            <span>Generate QR Codes</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedRecords}</div>
            <p className="text-xs text-muted-foreground">
              Out of {provenanceRecords.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Traceability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgTraceabilityScore)}`}>
              {avgTraceabilityScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Anchors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBlockchainAnchors}</div>
            <p className="text-xs text-muted-foreground">
              Total verifications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumer Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumerAccessible}</div>
            <p className="text-xs text-muted-foreground">
              QR codes generated
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">Provenance Records</TabsTrigger>
          <TabsTrigger value="journey">Product Journey</TabsTrigger>
          <TabsTrigger value="authenticity">Authenticity Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4">
            {provenanceRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Route className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{record.productName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAuthenticityBadge(record.authenticity)}
                      {record.originVerified && <Badge className="bg-green-500">Origin Verified</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {record.category} • Product ID: {record.productId}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(record.traceabilityScore)}`}>
                        {record.traceabilityScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Traceability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{record.completedSteps}</div>
                      <div className="text-xs text-muted-foreground">Steps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{record.blockchainAnchors}</div>
                      <div className="text-xs text-muted-foreground">Anchors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{record.currentStage}</div>
                      <div className="text-xs text-muted-foreground">Current Stage</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Journey Progress</span>
                      <span>{record.completedSteps}/{record.totalSteps} steps</span>
                    </div>
                    <Progress value={(record.completedSteps / record.totalSteps) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last Updated: {new Date(record.lastUpdated).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => viewJourney(record.productId)}>
                        View Journey
                      </Button>
                      {!record.qrCodeGenerated && (
                        <Button size="sm" onClick={() => generateQRCode(record.productId)}>
                          Generate QR
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <div className="grid gap-4">
            {provenanceJourney.map((step, index) => (
              <Card key={step.stepId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg">{step.stepName}</CardTitle>
                      {step.criticalControlPoint && <Badge variant="destructive" className="text-xs">CCP</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {step.verified ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge className="bg-yellow-500">Pending</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{step.location}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{new Date(step.timestamp).toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Participant:</span> {step.participant}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Event Type:</span> {step.eventType}
                      </div>
                      {step.blockchainTxId && (
                        <div className="text-sm">
                          <span className="font-medium">Blockchain TX:</span> 
                          <code className="ml-1 text-xs">{step.blockchainTxId.substring(0, 20)}...</code>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Documentation:</div>
                      <div className="flex flex-wrap gap-1">
                        {step.documentation.map((doc, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {step.nextStep && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Next step: {provenanceJourney.find(s => s.stepId === step.nextStep)?.stepName}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="authenticity" className="space-y-4">
          <div className="grid gap-4">
            {authenticityChecks.map((check) => (
              <Card key={check.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-lg capitalize">{check.checkType} Check</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getResultBadge(check.result)}
                      <Badge variant="outline" className="text-xs">
                        {check.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Product: {check.productId}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Method:</span> {check.verificationMethod}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Evidence:</span> {check.evidenceCount} items
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Timestamp:</span> {new Date(check.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Confidence:</span> {check.confidence}%
                      </div>
                      <Progress value={check.confidence} className="h-2" />
                      {check.blockchainProof && (
                        <div className="text-sm">
                          <span className="font-medium">Blockchain:</span> 
                          <code className="ml-1 text-xs">{check.blockchainProof.substring(0, 15)}...</code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Notes:</div>
                    <p className="text-sm text-muted-foreground">{check.notes}</p>
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