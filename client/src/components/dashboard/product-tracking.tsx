import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Scan, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Truck,
  Store,
  Leaf,
  RefreshCw
} from "lucide-react";

// Product tracking interfaces
interface ProductScan {
  id: string;
  tagId: string;
  scannerType: 'QR' | 'NFC' | 'RFID';
  locationId: string;
  companyId: string;
  eventType: 'FARM' | 'PROCESSING' | 'WAREHOUSE' | 'TRANSPORT' | 'RETAIL' | 'CONSUMER';
  timestamp: Date;
  blockchainTxId?: string;
  verified: boolean;
  metadata: {
    temperature?: number;
    humidity?: number;
    coordinates?: { lat: number; lng: number };
    handler?: string;
    notes?: string;
  };
}

interface ProductInfo {
  tagId: string;
  productId: string;
  productType: string;
  batchId: string;
  farmId: string;
  harvestDate: Date;
  expiryDate: Date;
  origin: string;
  certifications: string[];
  currentStatus: 'HARVESTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETAIL' | 'CONSUMED';
  scans: ProductScan[];
  totalScans: number;
  verifiedScans: number;
  lastScanLocation: string;
  lastScanTime: Date;
}

const EVENT_ICONS = {
  FARM: Leaf,
  PROCESSING: Package,
  WAREHOUSE: Package,
  TRANSPORT: Truck,
  RETAIL: Store,
  CONSUMER: Eye,
};

const STATUS_COLORS = {
  HARVESTED: "bg-green-100 text-green-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  RETAIL: "bg-orange-100 text-orange-800",
  CONSUMED: "bg-gray-100 text-gray-800",
};

export default function ProductTracking() {
  const [activeProductId, setActiveProductId] = useState("");
  const [trackingData, setTrackingData] = useState<ProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockProductData: ProductInfo = {
    tagId: "TAG-001-2024",
    productId: "PROD-APPLE-001",
    productType: "Organic Apples",
    batchId: "BATCH-2024-001",
    farmId: "FARM-GREENVALLEY-001",
    harvestDate: new Date("2024-01-15"),
    expiryDate: new Date("2024-02-15"),
    origin: "Green Valley Farms, California",
    certifications: ["Organic", "Non-GMO", "Fair Trade"],
    currentStatus: "RETAIL",
    totalScans: 8,
    verifiedScans: 7,
    lastScanLocation: "SuperMarket Plus - Aisle 3",
    lastScanTime: new Date("2024-01-20T10:30:00"),
    scans: [
      {
        id: "scan_001",
        tagId: "TAG-001-2024",
        scannerType: "QR",
        locationId: "FARM-GREENVALLEY-001",
        companyId: "comp_1234567890",
        eventType: "FARM",
        timestamp: new Date("2024-01-15T08:00:00"),
        blockchainTxId: "tx_001",
        verified: true,
        metadata: {
          temperature: 18,
          humidity: 65,
          handler: "John Smith",
          notes: "Fresh harvest - Grade A quality"
        }
      },
      {
        id: "scan_002",
        tagId: "TAG-001-2024",
        scannerType: "RFID",
        locationId: "PROCESSING-CENTER-001",
        companyId: "comp_1234567890",
        eventType: "PROCESSING",
        timestamp: new Date("2024-01-16T14:00:00"),
        blockchainTxId: "tx_002",
        verified: true,
        metadata: {
          temperature: 4,
          humidity: 80,
          handler: "Processing Team A",
          notes: "Washed, sorted, and packaged"
        }
      },
      {
        id: "scan_003",
        tagId: "TAG-001-2024",
        scannerType: "QR",
        locationId: "WAREHOUSE-001",
        companyId: "comp_0987654321",
        eventType: "WAREHOUSE",
        timestamp: new Date("2024-01-17T09:00:00"),
        blockchainTxId: "tx_003",
        verified: true,
        metadata: {
          temperature: 2,
          humidity: 85,
          handler: "Warehouse Team",
          notes: "Cold storage - ready for shipping"
        }
      },
      {
        id: "scan_004",
        tagId: "TAG-001-2024",
        scannerType: "NFC",
        locationId: "RETAIL-STORE-001",
        companyId: "comp_5678901234",
        eventType: "RETAIL",
        timestamp: new Date("2024-01-20T10:30:00"),
        blockchainTxId: "tx_004",
        verified: true,
        metadata: {
          temperature: 5,
          humidity: 70,
          handler: "Store Manager",
          notes: "Placed in produce section"
        }
      }
    ]
  };

  const handleTrackProduct = async () => {
    if (!activeProductId.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('GET', `/api/product-tracking/${activeProductId}`);
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedData = {
        ...data,
        harvestDate: new Date(data.harvestDate),
        expiryDate: new Date(data.expiryDate),
        lastScanTime: new Date(data.lastScanTime),
        scans: data.scans.map((scan: any) => ({
          ...scan,
          timestamp: new Date(scan.timestamp)
        }))
      };
      
      setTrackingData(processedData);
    } catch (error) {
      console.error('Error fetching product data:', error);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    const Icon = EVENT_ICONS[eventType as keyof typeof EVENT_ICONS] || Package;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Product Tracking System
          </CardTitle>
          <CardDescription>
            Track products through their complete supply chain journey via scanning system integration
          </CardDescription>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Scanning System Integration:</strong> This system automatically receives scan events from QR, NFC, and RFID scanners throughout the supply chain. Manual tracking is available for testing purposes.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="product-id">Product Tag ID</Label>
              <Input
                id="product-id"
                placeholder="Enter tag ID (e.g., TAG-001-2024)"
                value={activeProductId}
                onChange={(e) => setActiveProductId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackProduct()}
              />
            </div>
            <Button 
              onClick={handleTrackProduct}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Track Product"}
            </Button>
          </div>
          
          {/* Sample Product IDs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sample Product IDs (integrated with scanning system):</Label>
            <div className="flex flex-wrap gap-2">
              {['TAG-001-2024', 'TAG-002-2024', 'TAG-003-2024'].map(tagId => (
                <Button
                  key={tagId}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveProductId(tagId);
                    setTimeout(() => handleTrackProduct(), 100);
                  }}
                  disabled={isLoading}
                >
                  {tagId}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Information */}
      {trackingData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {trackingData.productType}
                </span>
                <Badge className={STATUS_COLORS[trackingData.currentStatus]}>
                  {trackingData.currentStatus}
                </Badge>
              </CardTitle>
              <CardDescription>
                Product ID: {trackingData.productId} • Batch: {trackingData.batchId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Origin</p>
                  <p className="text-sm text-gray-600">{trackingData.origin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Harvest Date</p>
                  <p className="text-sm text-gray-600">{trackingData.harvestDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Expiry Date</p>
                  <p className="text-sm text-gray-600">{trackingData.expiryDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Verification</p>
                  <p className="text-sm text-gray-600">{trackingData.verifiedScans}/{trackingData.totalScans} scans verified</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {trackingData.certifications.map(cert => (
                    <Badge key={cert} variant="outline">{cert}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Journey ({trackingData.totalScans} scans)</CardTitle>
              <CardDescription>
                Automated scan events from integrated scanning systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingData.scans.map((scan, index) => (
                  <div key={scan.id} className="relative">
                    {index < trackingData.scans.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {getEventIcon(scan.eventType)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{scan.eventType}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{scan.scannerType}</Badge>
                            {scan.verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Location:</span> {scan.locationId}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatDate(scan.timestamp)}
                          </div>
                          <div>
                            <span className="font-medium">Handler:</span> {scan.metadata.handler || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Blockchain TX:</span> {scan.blockchainTxId || 'Pending'}
                          </div>
                        </div>
                        
                        {scan.metadata.notes && (
                          <p className="text-sm text-gray-600 italic">
                            "{scan.metadata.notes}"
                          </p>
                        )}
                        
                        {(scan.metadata.temperature || scan.metadata.humidity) && (
                          <div className="flex gap-4 text-sm text-gray-600">
                            {scan.metadata.temperature && (
                              <span>Temperature: {scan.metadata.temperature}°C</span>
                            )}
                            {scan.metadata.humidity && (
                              <span>Humidity: {scan.metadata.humidity}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results */}
      {activeProductId && !trackingData && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Product Not Found</h3>
            <p className="text-sm text-gray-600">
              No product found with ID "{activeProductId}". This could mean:
            </p>
            <ul className="text-sm text-gray-600 mt-2 text-left max-w-md mx-auto">
              <li>• The product hasn't been scanned yet</li>
              <li>• The tag ID is incorrect</li>
              <li>• The product is not in the current system</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}