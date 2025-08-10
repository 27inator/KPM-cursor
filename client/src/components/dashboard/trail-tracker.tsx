import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Truck,
  Factory,
  Store,
  Leaf,
  Clock,
  Shield
} from "lucide-react";

interface ProductJourney {
  tagId: string;
  product: {
    id: number;
    tagId: string;
    productId: string;
    productType: string;
    batchId: string;
    farmId: string;
    harvestDate: string;
    expiryDate: string;
    origin: string;
    certifications: string[];
    qrCode: string;
    nfcId: string;
    createdAt: string;
    updatedAt: string;
  };
  events: Array<{
    id: number;
    eventId: string;
    eventType: string;
    timestamp: number;
    companyId: string;
    companyName: string;
    txid: string;
    leafHash: string;
    merkleRoot: string;
    status: string;
    fee: number;
    verified: boolean;
    createdAt: string;
  }>;
  currentLocation: string;
  currentStatus: string;
  verificationStatus: 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED';
  totalEvents: number;
  lastUpdated: string;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'FARM': return <Leaf className="h-4 w-4" />;
    case 'PROCESSING': return <Factory className="h-4 w-4" />;
    case 'SHIP': return <Truck className="h-4 w-4" />;
    case 'WAREHOUSE': return <Package className="h-4 w-4" />;
    case 'RETAIL': return <Store className="h-4 w-4" />;
    case 'PURCHASE': return <CheckCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-800';
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
    case 'UNVERIFIED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'FARM': return 'bg-green-100 text-green-800 border-green-200';
    case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SHIP': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'WAREHOUSE': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'RETAIL': return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'PURCHASE': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function TrailTracker() {
  const [searchTagId, setSearchTagId] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");

  const { data: journey, isLoading, error } = useQuery<ProductJourney>({
    queryKey: ['/api/trail', selectedTagId],
    queryFn: async () => {
      const response = await fetch(`/api/trail?tag=${selectedTagId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      return response.json();
    },
    enabled: !!selectedTagId,
  });

  const handleSearch = () => {
    if (searchTagId.trim()) {
      setSelectedTagId(searchTagId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatISODate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openKaspaExplorer = (txid: string) => {
    window.open(`https://explorer.kaspa.org/txs/${txid}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Trail Tracker</h2>
          <p className="text-gray-600">Search and track product journey through the supply chain</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Product Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter product tag ID (e.g., TAG-001, TAG-002)"
              value={searchTagId}
              onChange={(e) => setSearchTagId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!searchTagId.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Try these examples:</span>
            {['TAG-001', 'TAG-002', 'TAG-003'].map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTagId(tag);
                  setSelectedTagId(tag);
                }}
                className="text-xs"
              >
                {tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Results */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa-500"></div>
            <span className="ml-2">Loading product journey...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <XCircle className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-red-600">Product not found or error loading journey</span>
          </CardContent>
        </Card>
      )}

      {journey && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{journey.product?.productType || 'Unknown Product'}</h3>
                <p className="text-sm text-gray-600">{journey.product?.productId || 'N/A'}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Tag ID:</span>
                  <span className="text-sm">{journey.tagId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Batch:</span>
                  <span className="text-sm">{journey.product?.batchId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Farm:</span>
                  <span className="text-sm">{journey.product?.farmId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Origin:</span>
                  <span className="text-sm">{journey.product?.origin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Harvest Date:</span>
                  <span className="text-sm">
                    {journey.product?.harvestDate ? formatISODate(journey.product.harvestDate) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expiry Date:</span>
                  <span className="text-sm">
                    {journey.product?.expiryDate ? formatISODate(journey.product.expiryDate) : 'N/A'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge variant="outline">{journey.currentStatus}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{journey.currentLocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification:</span>
                  <Badge className={getStatusColor(journey.verificationStatus)}>
                    {journey.verificationStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Events:</span>
                  <span className="text-sm">{journey.totalEvents}</span>
                </div>
              </div>

              {journey.product?.certifications && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium mb-2 block">Certifications:</span>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(journey.product.certifications).map((cert: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Journey Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Supply Chain Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {journey.events.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${getEventColor(event.eventType)}`}>
                          {getEventIcon(event.eventType)}
                        </div>
                        {index < journey.events.length - 1 && (
                          <div className="w-px h-12 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getEventColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                            {event.verified && (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{event.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>Event ID: {event.eventId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Status: {event.status}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Fee: {event.fee} KAS</span>
                          </div>
                        </div>

                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono">TX: {event.txid.substring(0, 20)}...</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openKaspaExplorer(event.txid)}
                              className="h-6 text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                          <div className="text-gray-600 mt-1">
                            Hash: {event.leafHash.substring(0, 20)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}