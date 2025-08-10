import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  RefreshCw,
  Shield,
  ExternalLink,
  Hash,
  Clock
} from "lucide-react";

// Combined interfaces for both product tracking and provenance
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

interface ProvenanceEvent {
  id: number;
  eventId: string;
  companyId: string;
  tagId: string;
  eventType: string;
  ts: number;
  txid: string;
  status: string;
  fee: number;
  leafHash: string;
  merkleRoot: string;
  transaction?: {
    txid: string;
    confirmations: number;
    blockHash?: string;
    timestamp: number;
  };
  verified: boolean;
}

const EVENT_ICONS = {
  FARM: Leaf,
  PROCESSING: Package,
  WAREHOUSE: Package,
  TRANSPORT: Truck,
  RETAIL: Store,
  CONSUMER: Eye,
  SHIP: Truck,
  QC: Shield,
};

const STATUS_COLORS = {
  HARVESTED: "bg-green-100 text-green-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  RETAIL: "bg-orange-100 text-orange-800",
  CONSUMED: "bg-gray-100 text-gray-800",
};

export default function SupplyChainTracking() {
  const [activeProductId, setActiveProductId] = useState("");
  const [trackingData, setTrackingData] = useState<ProductInfo | null>(null);
  const [provenanceData, setProvenanceData] = useState<ProvenanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProvenanceEvent | null>(null);

  const handleTrackProduct = async () => {
    if (!activeProductId.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Fetch both product tracking and provenance data
      const [productResponse, provenanceResponse] = await Promise.all([
        apiRequest('GET', `/api/product-tracking/${activeProductId}`),
        apiRequest('GET', `/api/provenance/${activeProductId}`)
      ]);
      
      const productData = await productResponse.json();
      const provenanceData = await provenanceResponse.json();
      
      // Convert date strings to Date objects
      const processedData = {
        ...productData,
        harvestDate: new Date(productData.harvestDate),
        expiryDate: new Date(productData.expiryDate),
        lastScanTime: new Date(productData.lastScanTime),
        scans: productData.scans.map((scan: any) => ({
          ...scan,
          timestamp: new Date(scan.timestamp)
        }))
      };
      
      setTrackingData(processedData);
      setProvenanceData(provenanceData.events || []);
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
      setTrackingData(null);
      setProvenanceData([]);
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

  const getProvenanceForScan = (scan: ProductScan) => {
    return provenanceData.find(event => event.txid === scan.blockchainTxId);
  };

  const ProvenanceModal = ({ event }: { event: ProvenanceEvent }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Proof - {event.eventType}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Event Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Event ID</Label>
            <p className="text-sm text-gray-600 font-mono">{event.eventId}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Status</Label>
            <Badge variant={event.verified ? "default" : "secondary"}>
              {event.status}
            </Badge>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Company ID</Label>
            <p className="text-sm text-gray-600">{event.companyId}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Fee</Label>
            <p className="text-sm text-gray-600">{event.fee} KAS</p>
          </div>
        </div>

        {/* Blockchain Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Blockchain Verification</h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Transaction ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {event.txid}
                </code>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Leaf Hash</Label>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block mt-1">
                {event.leafHash}
              </code>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Merkle Root</Label>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block mt-1">
                {event.merkleRoot}
              </code>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        {event.transaction && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Confirmations</Label>
                <p className="text-sm text-gray-600">{event.transaction.confirmations}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Timestamp</Label>
                <p className="text-sm text-gray-600">
                  {new Date(event.transaction.timestamp * 1000).toLocaleString()}
                </p>
              </div>
              {event.transaction.blockHash && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Block Hash</Label>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block mt-1">
                    {event.transaction.blockHash}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          {event.verified ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Verified on Kaspa Blockchain</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Pending Verification</span>
            </>
          )}
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Supply Chain Tracking
          </CardTitle>
          <CardDescription>
            Complete product journey with blockchain proof verification
          </CardDescription>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Integrated System:</strong> View complete product tracking with scanning system integration and click on any event to see blockchain proof details.
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
            <Label className="text-sm font-medium">Sample Product IDs:</Label>
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
                  <p className="text-sm text-gray-600">{trackingData.verifiedScans}/{trackingData.totalScans} verified</p>
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

          {/* Supply Chain Journey with Blockchain Proof */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Supply Chain Journey ({trackingData.totalScans} events)
              </CardTitle>
              <CardDescription>
                Complete journey with blockchain verification - click any event to view proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingData.scans.map((scan, index) => {
                  const provenanceEvent = getProvenanceForScan(scan);
                  return (
                    <div key={scan.id} className="relative">
                      {index < trackingData.scans.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
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
                              {provenanceEvent && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Shield className="h-4 w-4" />
                                      View Proof
                                    </Button>
                                  </DialogTrigger>
                                  <ProvenanceModal event={provenanceEvent} />
                                </Dialog>
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
                              <span className="font-medium">Blockchain TX:</span> {scan.blockchainTxId ? (
                                <code className="text-xs bg-gray-100 px-1 rounded">
                                  {scan.blockchainTxId.slice(0, 12)}...
                                </code>
                              ) : 'Pending'}
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
                                <span>🌡️ {scan.metadata.temperature}°C</span>
                              )}
                              {scan.metadata.humidity && (
                                <span>💧 {scan.metadata.humidity}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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