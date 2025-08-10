import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Smartphone, QrCode, Package, MapPin, Calendar, Shield, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function ConsumerPreview() {
  const [tagId, setTagId] = useState("TAG-123456");
  const [scanMode, setScanMode] = useState<"search" | "scan">("search");

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['/api/consumer/scan', tagId],
    queryFn: async () => {
      const response = await fetch(`/api/consumer/scan/${tagId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      return response.json();
    },
    enabled: !!tagId
  });

  const { data: detailData } = useQuery({
    queryKey: ['/api/consumer/product', tagId],
    queryFn: async () => {
      const response = await fetch(`/api/consumer/product/${tagId}`);
      if (!response.ok) {
        throw new Error('Product details not found');
      }
      return response.json();
    },
    enabled: !!tagId && !!productData?.productFound
  });

  const handleScan = () => {
    setScanMode("scan");
    // In a real mobile app, this would activate the camera
    // For demo purposes, we'll just show a sample scan result
    setTagId("TAG-123456");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'harvest':
      case 'farm':
        return '🌾';
      case 'processing':
        return '🏭';
      case 'packaging':
        return '📦';
      case 'transport':
      case 'shipping':
        return '🚛';
      case 'retail':
        return '🏪';
      case 'warehouse':
        return '🏪';
      default:
        return '📍';
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Consumer Mobile Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={scanMode === "scan" ? "default" : "outline"}
              onClick={handleScan}
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
            <Button 
              variant={scanMode === "search" ? "default" : "outline"}
              onClick={() => setScanMode("search")}
              className="flex-1"
            >
              Search
            </Button>
          </div>

          {scanMode === "search" && (
            <div className="space-y-2">
              <Input
                placeholder="Enter Product Tag ID"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
              />
            </div>
          )}

          {scanMode === "scan" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Point camera at QR code</p>
              <p className="text-xs text-gray-500 mt-1">Demo: Auto-filled with sample data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile App Status */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Mobile App Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-700">
            The consumer mobile app is fully developed and ready for deployment. 
            It includes all the features needed for consumers to scan products and view their supply chain journey.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-800 mb-2">Core Features</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• QR Code camera scanning</li>
                <li>• Product search by tag ID</li>
                <li>• Complete supply chain journey</li>
                <li>• Blockchain verification links</li>
                <li>• Offline product caching</li>
                <li>• Favorites system</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 mb-2">Technical Stack</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• React Native with Expo</li>
                <li>• TypeScript for type safety</li>
                <li>• Zustand for state management</li>
                <li>• React Query for API calls</li>
                <li>• AsyncStorage for offline mode</li>
                <li>• Cross-platform compatibility</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-100 p-3 rounded-lg">
            <p className="text-xs text-green-700 mb-2">
              <strong>Try it now:</strong> Search for <code className="bg-green-200 px-1 rounded">TAG-123456</code> above to see the mobile experience
            </p>
            <p className="text-xs text-green-600">
              The mobile app files are ready in the <code>/mobile</code> directory with complete installation instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa-500"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Product Not Found</p>
              <p className="text-sm text-gray-600">This QR code may be invalid or the product is not registered</p>
            </div>
          </CardContent>
        </Card>
      )}

      {productData?.productFound && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                {productData.product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm">{productData.product.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Origin</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <p className="text-sm">{productData.product.origin}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Harvested</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <p className="text-sm">{formatDate(productData.product.harvestDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Best Before</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <p className="text-sm">{formatDate(productData.product.expiryDate)}</p>
                  </div>
                </div>
              </div>

              {productData.product.certifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {productData.product.certifications.map((cert: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{productData.totalEvents}</p>
                  <p className="text-xs text-gray-600">Supply Chain Events</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{productData.verificationRate}%</p>
                  <p className="text-xs text-gray-600">Blockchain Verified</p>
                </div>
              </div>

              {productData.latestUpdate && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Latest Update</p>
                  <p className="text-sm text-gray-600">{productData.latestUpdate.eventType}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(productData.latestUpdate.timestamp), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {detailData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Supply Chain Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {detailData.journey.map((event: any, index: number) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="text-lg">{getEventTypeIcon(event.eventType)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{event.eventType}</p>
                            <Badge variant={event.verified ? "default" : "secondary"} className="text-xs">
                              {event.verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}
                          </p>
                          {event.blockchainProof && (
                            <a 
                              href={event.blockchainProof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                              View Proof
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}