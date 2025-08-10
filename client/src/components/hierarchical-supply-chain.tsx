import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, MapPin, Clock, CheckCircle, AlertTriangle, TrendingUp, Package, Shield, Search, ArrowRight, ArrowLeft, QrCode, Barcode } from 'lucide-react';

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
  expirationDate: string;
  weight: string;
}

interface SupplyChainEvent {
  id: string;
  packageId: string;
  eventType: string;
  timestamp: string;
  location: string;
  participant: string;
  description: string;
  blockchainTxId: string;
  verified: boolean;
  documentation: string[];
}

export default function HierarchicalSupplyChain() {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const productCategories: ProductCategory[] = [
    {
      id: 'cat_ribeye',
      categoryName: 'Grass Fed Ribeye Steaks',
      description: '100% grass-fed ribeye steaks from certified organic farms',
      totalPackages: 156,
      avgTransparencyScore: 94,
      verifiedPackages: 148,
      totalBlockchainProofs: 1248,
      lastUpdated: '2025-01-17T11:30:00Z',
      riskLevel: 'low',
      avgConsumerTrust: 96,
      packages: [
        {
          id: 'pkg_ribeye_001',
          categoryId: 'cat_ribeye',
          packageId: 'RIB-2025-001',
          barcode: '850123456789',
          productName: 'Grass Fed Ribeye Steak - 12oz',
          batchNumber: 'GF-RIB-240115',
          transparencyScore: 98,
          completeness: 95,
          verificationStatus: 'verified',
          supplyChainSteps: 8,
          blockchainProofs: 7,
          lastUpdated: '2025-01-17T10:30:00Z',
          riskLevel: 'low',
          consumerTrust: 97,
          qrCodeGenerated: true,
          consumerScans: 234,
          expirationDate: '2025-01-25',
          weight: '12oz'
        },
        {
          id: 'pkg_ribeye_002',
          categoryId: 'cat_ribeye',
          packageId: 'RIB-2025-002',
          barcode: '850123456790',
          productName: 'Grass Fed Ribeye Steak - 16oz',
          batchNumber: 'GF-RIB-240115',
          transparencyScore: 96,
          completeness: 92,
          verificationStatus: 'verified',
          supplyChainSteps: 8,
          blockchainProofs: 7,
          lastUpdated: '2025-01-17T09:45:00Z',
          riskLevel: 'low',
          consumerTrust: 95,
          qrCodeGenerated: true,
          consumerScans: 189,
          expirationDate: '2025-01-25',
          weight: '16oz'
        }
      ]
    },
    {
      id: 'cat_organic_tomatoes',
      categoryName: 'Organic Cherry Tomatoes',
      description: 'Premium organic cherry tomatoes from certified organic farms',
      totalPackages: 234,
      avgTransparencyScore: 91,
      verifiedPackages: 220,
      totalBlockchainProofs: 1872,
      lastUpdated: '2025-01-17T12:00:00Z',
      riskLevel: 'low',
      avgConsumerTrust: 93,
      packages: [
        {
          id: 'pkg_tomato_001',
          categoryId: 'cat_organic_tomatoes',
          packageId: 'TOM-2025-001',
          barcode: '850234567890',
          productName: 'Organic Cherry Tomatoes - 1lb',
          batchNumber: 'ORG-TOM-240116',
          transparencyScore: 94,
          completeness: 89,
          verificationStatus: 'verified',
          supplyChainSteps: 6,
          blockchainProofs: 5,
          lastUpdated: '2025-01-17T11:15:00Z',
          riskLevel: 'low',
          consumerTrust: 92,
          qrCodeGenerated: true,
          consumerScans: 156,
          expirationDate: '2025-01-22',
          weight: '1lb'
        }
      ]
    },
    {
      id: 'cat_wild_salmon',
      categoryName: 'Wild Caught Salmon',
      description: 'Sustainably caught wild salmon from Alaska',
      totalPackages: 89,
      avgTransparencyScore: 97,
      verifiedPackages: 87,
      totalBlockchainProofs: 801,
      lastUpdated: '2025-01-17T10:45:00Z',
      riskLevel: 'low',
      avgConsumerTrust: 98,
      packages: [
        {
          id: 'pkg_salmon_001',
          categoryId: 'cat_wild_salmon',
          packageId: 'SAL-2025-001',
          barcode: '850345678901',
          productName: 'Wild Salmon Fillet - 8oz',
          batchNumber: 'WS-SAL-240114',
          transparencyScore: 99,
          completeness: 98,
          verificationStatus: 'verified',
          supplyChainSteps: 9,
          blockchainProofs: 8,
          lastUpdated: '2025-01-17T10:00:00Z',
          riskLevel: 'low',
          consumerTrust: 99,
          qrCodeGenerated: true,
          consumerScans: 345,
          expirationDate: '2025-01-20',
          weight: '8oz'
        }
      ]
    }
  ];

  const supplyChainEvents: SupplyChainEvent[] = [
    {
      id: 'evt_001',
      packageId: 'pkg_ribeye_001',
      eventType: 'FARM_ORIGIN',
      timestamp: '2025-01-10T06:00:00Z',
      location: 'Meadowbrook Ranch, Montana',
      participant: 'Meadowbrook Organic Ranch',
      description: 'Cattle raised on organic pastures, grass-fed for 24 months',
      blockchainTxId: '0xa1b2c3d4e5f6789...',
      verified: true,
      documentation: ['Organic Certificate', 'Grass-Fed Verification', 'Animal Welfare Audit']
    },
    {
      id: 'evt_002',
      packageId: 'pkg_ribeye_001',
      eventType: 'PROCESSING',
      timestamp: '2025-01-12T08:30:00Z',
      location: 'Premium Processing Facility, Colorado',
      participant: 'Mountain Fresh Processing',
      description: 'USDA-inspected processing with quality grade verification',
      blockchainTxId: '0xb2c3d4e5f6789...',
      verified: true,
      documentation: ['USDA Inspection', 'Quality Grade Report', 'Processing Log']
    },
    {
      id: 'evt_003',
      packageId: 'pkg_ribeye_001',
      eventType: 'PACKAGING',
      timestamp: '2025-01-14T10:15:00Z',
      location: 'Packaging Center, Colorado',
      participant: 'Fresh Pack Solutions',
      description: 'Vacuum sealed in modified atmosphere packaging',
      blockchainTxId: '0xc3d4e5f6789...',
      verified: true,
      documentation: ['Packaging Specs', 'Label Verification', 'Weight Certification']
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

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'incomplete': return <Badge className="bg-red-500">Incomplete</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const viewCategoryDetails = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setActiveTab('packages');
  };

  const viewPackageDetails = (packageId: string) => {
    setSelectedPackage(packageId);
    setActiveTab('package-details');
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedPackage(null);
    setActiveTab('categories');
  };

  const goBackToPackages = () => {
    setSelectedPackage(null);
    setActiveTab('packages');
  };

  const generateQRCode = (packageId: string) => {
    alert(`Generating QR code for package: ${packageId}`);
  };

  const selectedCategoryData = selectedCategory ? productCategories.find(c => c.id === selectedCategory) : null;
  const selectedPackageData = selectedPackage ? 
    productCategories.flatMap(c => c.packages).find(p => p.id === selectedPackage) : null;
  const packageEvents = selectedPackage ? supplyChainEvents.filter(e => e.packageId === selectedPackage) : [];

  const totalCategories = productCategories.length;
  const totalPackages = productCategories.reduce((sum, c) => sum + c.totalPackages, 0);
  const avgTransparencyScore = productCategories.reduce((sum, c) => sum + c.avgTransparencyScore, 0) / totalCategories;
  const totalVerifiedPackages = productCategories.reduce((sum, c) => sum + c.verifiedPackages, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hierarchical Supply Chain Tracking</h2>
          <p className="text-muted-foreground">
            Product categories and individual package tracking with blockchain verification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(selectedCategory || selectedPackage) && (
            <Button variant="outline" onClick={goBackToCategories} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Categories</span>
            </Button>
          )}
          <Button className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search Products</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPackages}</div>
            <p className="text-xs text-muted-foreground">
              Individual packages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Transparency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgTransparencyScore)}`}>
              {avgTransparencyScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalVerifiedPackages}</div>
            <p className="text-xs text-muted-foreground">
              Blockchain verified
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Product Categories</TabsTrigger>
          <TabsTrigger value="packages" disabled={!selectedCategory}>Package Details</TabsTrigger>
          <TabsTrigger value="package-details" disabled={!selectedPackage}>Individual Package</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {productCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getScoreBadge(category.avgTransparencyScore)}
                      {getRiskBadge(category.riskLevel)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{category.totalPackages}</div>
                      <div className="text-xs text-muted-foreground">Total Packages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{category.verifiedPackages}</div>
                      <div className="text-xs text-muted-foreground">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(category.avgTransparencyScore)}`}>
                        {category.avgTransparencyScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Transparency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{category.totalBlockchainProofs}</div>
                      <div className="text-xs text-muted-foreground">Blockchain Proofs</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Package Verification Rate</span>
                      <span>{((category.verifiedPackages / category.totalPackages) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(category.verifiedPackages / category.totalPackages) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last Updated: {new Date(category.lastUpdated).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Analytics
                      </Button>
                      <Button size="sm" onClick={() => viewCategoryDetails(category.id)}>
                        View Packages
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          {selectedCategoryData && (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <Button variant="outline" size="sm" onClick={goBackToCategories}>
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
                <h3 className="text-xl font-semibold">{selectedCategoryData.categoryName} - Individual Packages</h3>
              </div>
              
              <div className="grid gap-4">
                {selectedCategoryData.packages.map((pkg) => (
                  <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Barcode className="h-4 w-4 text-purple-500" />
                          <CardTitle className="text-lg">{pkg.productName}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getVerificationBadge(pkg.verificationStatus)}
                          {pkg.qrCodeGenerated && <Badge className="bg-blue-500">QR Ready</Badge>}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Package ID: {pkg.packageId} • Barcode: {pkg.barcode} • Batch: {pkg.batchNumber}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className={`text-xl font-bold ${getScoreColor(pkg.transparencyScore)}`}>
                            {pkg.transparencyScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">Transparency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">{pkg.blockchainProofs}</div>
                          <div className="text-xs text-muted-foreground">Proofs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">{pkg.consumerScans}</div>
                          <div className="text-xs text-muted-foreground">Scans</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">{pkg.weight}</div>
                          <div className="text-xs text-muted-foreground">Weight</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">{new Date(pkg.expirationDate).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">Expires</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Supply Chain Progress</span>
                          <span>{pkg.blockchainProofs}/{pkg.supplyChainSteps} steps</span>
                        </div>
                        <Progress value={(pkg.blockchainProofs / pkg.supplyChainSteps) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Last Updated: {new Date(pkg.lastUpdated).toLocaleString()}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!pkg.qrCodeGenerated && (
                            <Button size="sm" variant="outline" onClick={() => generateQRCode(pkg.id)}>
                              <QrCode className="h-3 w-3 mr-1" />
                              Generate QR
                            </Button>
                          )}
                          <Button size="sm" onClick={() => viewPackageDetails(pkg.id)}>
                            View Details
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="package-details" className="space-y-4">
          {selectedPackageData && (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <Button variant="outline" size="sm" onClick={goBackToPackages}>
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Packages
                </Button>
                <h3 className="text-xl font-semibold">{selectedPackageData.productName} - Supply Chain Journey</h3>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span>Package Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm"><span className="font-medium">Package ID:</span> {selectedPackageData.packageId}</div>
                      <div className="text-sm"><span className="font-medium">Barcode:</span> {selectedPackageData.barcode}</div>
                      <div className="text-sm"><span className="font-medium">Batch Number:</span> {selectedPackageData.batchNumber}</div>
                      <div className="text-sm"><span className="font-medium">Weight:</span> {selectedPackageData.weight}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm"><span className="font-medium">Transparency Score:</span> {selectedPackageData.transparencyScore}%</div>
                      <div className="text-sm"><span className="font-medium">Consumer Scans:</span> {selectedPackageData.consumerScans}</div>
                      <div className="text-sm"><span className="font-medium">Expiration Date:</span> {new Date(selectedPackageData.expirationDate).toLocaleDateString()}</div>
                      <div className="text-sm"><span className="font-medium">QR Code:</span> {selectedPackageData.qrCodeGenerated ? 'Generated' : 'Not Generated'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Supply Chain Events</h4>
                {packageEvents.map((event, index) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <CardTitle className="text-lg">{event.eventType.replace('_', ' ')}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {event.verified ? (
                            <Badge className="bg-green-500">Verified</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{event.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm"><span className="font-medium">Participant:</span> {event.participant}</div>
                          <div className="text-sm"><span className="font-medium">Blockchain TX:</span> <code className="text-xs">{event.blockchainTxId.substring(0, 15)}...</code></div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Documentation:</div>
                          <div className="flex flex-wrap gap-1">
                            {event.documentation.map((doc, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}