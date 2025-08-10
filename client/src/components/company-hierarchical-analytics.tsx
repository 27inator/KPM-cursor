import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, MapPin, Clock, CheckCircle, AlertTriangle, TrendingUp, Package, Shield, Search, ArrowRight, ArrowLeft, QrCode, Barcode, Building } from 'lucide-react';

interface CompanyProductCategory {
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
  packages: CompanyProductPackage[];
}

interface CompanyProductPackage {
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
  currentLocation: string;
}

interface CompanySupplyChainEvent {
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
  companyRole: string;
}

interface CompanyHierarchicalAnalyticsProps {
  companyId: string;
}

export default function CompanyHierarchicalAnalytics({ companyId }: CompanyHierarchicalAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for company-specific products
  const companyProductCategories: CompanyProductCategory[] = [
    {
      id: 'company_cat_ribeye',
      categoryName: 'Premium Grass Fed Ribeye',
      description: 'Our signature grass-fed ribeye steaks from certified organic ranches',
      totalPackages: 45,
      avgTransparencyScore: 96,
      verifiedPackages: 43,
      totalBlockchainProofs: 387,
      lastUpdated: '2025-01-17T11:30:00Z',
      riskLevel: 'low',
      avgConsumerTrust: 97,
      packages: [
        {
          id: 'company_pkg_ribeye_001',
          categoryId: 'company_cat_ribeye',
          packageId: 'PRB-2025-001',
          barcode: '850987654321',
          productName: 'Premium Grass Fed Ribeye - 14oz',
          batchNumber: 'PGF-RIB-250117',
          transparencyScore: 98,
          completeness: 96,
          verificationStatus: 'verified',
          supplyChainSteps: 8,
          blockchainProofs: 8,
          lastUpdated: '2025-01-17T10:30:00Z',
          riskLevel: 'low',
          consumerTrust: 98,
          qrCodeGenerated: true,
          consumerScans: 156,
          expirationDate: '2025-01-26',
          weight: '14oz',
          currentLocation: 'Distribution Center - Denver'
        },
        {
          id: 'company_pkg_ribeye_002',
          categoryId: 'company_cat_ribeye',
          packageId: 'PRB-2025-002',
          barcode: '850987654322',
          productName: 'Premium Grass Fed Ribeye - 16oz',
          batchNumber: 'PGF-RIB-250117',
          transparencyScore: 97,
          completeness: 94,
          verificationStatus: 'verified',
          supplyChainSteps: 8,
          blockchainProofs: 7,
          lastUpdated: '2025-01-17T09:45:00Z',
          riskLevel: 'low',
          consumerTrust: 96,
          qrCodeGenerated: true,
          consumerScans: 123,
          expirationDate: '2025-01-26',
          weight: '16oz',
          currentLocation: 'Retail Store - Chicago'
        }
      ]
    },
    {
      id: 'company_cat_salmon',
      categoryName: 'Wild Alaska Salmon',
      description: 'Sustainably caught wild salmon from our trusted Alaska partners',
      totalPackages: 28,
      avgTransparencyScore: 94,
      verifiedPackages: 27,
      totalBlockchainProofs: 252,
      lastUpdated: '2025-01-17T12:15:00Z',
      riskLevel: 'low',
      avgConsumerTrust: 95,
      packages: [
        {
          id: 'company_pkg_salmon_001',
          categoryId: 'company_cat_salmon',
          packageId: 'WAS-2025-001',
          barcode: '850987654323',
          productName: 'Wild Alaska Salmon Fillet - 10oz',
          batchNumber: 'WAS-SAL-250116',
          transparencyScore: 95,
          completeness: 92,
          verificationStatus: 'verified',
          supplyChainSteps: 9,
          blockchainProofs: 8,
          lastUpdated: '2025-01-17T11:00:00Z',
          riskLevel: 'low',
          consumerTrust: 96,
          qrCodeGenerated: true,
          consumerScans: 89,
          expirationDate: '2025-01-21',
          weight: '10oz',
          currentLocation: 'Cold Storage - Seattle'
        }
      ]
    }
  ];

  const companySupplyChainEvents: CompanySupplyChainEvent[] = [
    {
      id: 'company_evt_001',
      packageId: 'company_pkg_ribeye_001',
      eventType: 'RANCH_SOURCING',
      timestamp: '2025-01-10T07:00:00Z',
      location: 'Heritage Ranch, Montana',
      participant: 'Heritage Organic Ranch',
      description: 'Premium grass-fed cattle sourced from our verified partner ranch',
      blockchainTxId: '0x9f8e7d6c5b4a...',
      verified: true,
      documentation: ['Organic Certificate', 'Grass-Fed Verification', 'Partnership Agreement'],
      companyRole: 'Buyer'
    },
    {
      id: 'company_evt_002',
      packageId: 'company_pkg_ribeye_001',
      eventType: 'QUALITY_PROCESSING',
      timestamp: '2025-01-12T09:30:00Z',
      location: 'Premium Processing Facility, Colorado',
      participant: 'Elite Meat Processing',
      description: 'Premium processing with our quality standards and specifications',
      blockchainTxId: '0x8e7d6c5b4a9f...',
      verified: true,
      documentation: ['Quality Specs', 'Processing Certificate', 'HACCP Compliance'],
      companyRole: 'Quality Controller'
    },
    {
      id: 'company_evt_003',
      packageId: 'company_pkg_ribeye_001',
      eventType: 'BRANDED_PACKAGING',
      timestamp: '2025-01-14T11:15:00Z',
      location: 'Company Packaging Center, Colorado',
      participant: 'Our Packaging Team',
      description: 'Branded packaging with our premium label and quality seals',
      blockchainTxId: '0x7d6c5b4a9f8e...',
      verified: true,
      documentation: ['Brand Guidelines', 'Label Verification', 'Quality Seals'],
      companyRole: 'Packager'
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
    alert(`Generating consumer QR code for package: ${packageId}`);
  };

  const selectedCategoryData = selectedCategory ? companyProductCategories.find(c => c.id === selectedCategory) : null;
  const selectedPackageData = selectedPackage ? 
    companyProductCategories.flatMap(c => c.packages).find(p => p.id === selectedPackage) : null;
  const packageEvents = selectedPackage ? companySupplyChainEvents.filter(e => e.packageId === selectedPackage) : [];

  const totalCategories = companyProductCategories.length;
  const totalPackages = companyProductCategories.reduce((sum, c) => sum + c.totalPackages, 0);
  const avgTransparencyScore = companyProductCategories.reduce((sum, c) => sum + c.avgTransparencyScore, 0) / totalCategories;
  const totalVerifiedPackages = companyProductCategories.reduce((sum, c) => sum + c.verifiedPackages, 0);
  const totalConsumerScans = companyProductCategories.flatMap(c => c.packages).reduce((sum, p) => sum + p.consumerScans, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Analytics</h2>
          <p className="text-muted-foreground">
            Your product categories and individual package tracking with blockchain verification
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Product Categories</CardTitle>
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
              Across all products
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumer Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalConsumerScans}</div>
            <p className="text-xs text-muted-foreground">
              Total QR scans
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Your Product Categories</TabsTrigger>
          <TabsTrigger value="packages" disabled={!selectedCategory}>Package Details</TabsTrigger>
          <TabsTrigger value="package-details" disabled={!selectedPackage}>Individual Package</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {companyProductCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-500" />
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
                      <div className="text-xs text-muted-foreground">Your Packages</div>
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
                <h3 className="text-xl font-semibold">{selectedCategoryData.categoryName} - Your Packages</h3>
              </div>
              
              <div className="grid gap-4">
                {selectedCategoryData.packages.map((pkg) => (
                  <Card key={pkg.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Barcode className="h-4 w-4 text-green-500" />
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
                      <div className="text-sm text-blue-600">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Current Location: {pkg.currentLocation}
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
                          <div className="text-xl font-bold text-blue-600">{pkg.consumerScans}</div>
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
                            View Journey
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

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    <span>Your Package Information</span>
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
                      <div className="text-sm"><span className="font-medium">Current Location:</span> {selectedPackageData.currentLocation}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Your Supply Chain Journey</h4>
                {packageEvents.map((event, index) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
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
                          <Badge variant="outline">{event.companyRole}</Badge>
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
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm">{event.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm"><span className="font-medium">Partner:</span> {event.participant}</div>
                          <div className="text-sm"><span className="font-medium">Your Role:</span> {event.companyRole}</div>
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