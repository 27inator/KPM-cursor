import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, ExternalLink, CheckCircle, Clock, AlertCircle, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

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
  transaction?: {
    txid: string;
    confirmations: number;
    blockHash?: string;
    timestamp: number;
  };
  verified: boolean;
}

interface ProvenanceChain {
  tagId: string;
  events: ProvenanceEvent[];
  totalEvents: number;
  verified: boolean;
}

const EVENT_ICONS = {
  FARM: Package,
  SHIP: Truck,
  QC: CheckCircle,
  RETAIL: AlertCircle,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "failed": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function ProvenanceTracker() {
  const [tagId, setTagId] = useState("");
  const [provenanceChain, setProvenanceChain] = useState<ProvenanceChain | null>(null);
  const { toast } = useToast();

  const searchProvenanceMutation = useMutation({
    mutationFn: async (searchTagId: string) => {
      const response = await apiRequest('GET', `/api/provenance/${searchTagId}`);
      return response.json();
    },
    onSuccess: (data) => {
      setProvenanceChain(data);
      toast({
        title: "Provenance Retrieved",
        description: `Found ${data.totalEvents} events for tag ${data.tagId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to retrieve provenance chain",
        variant: "destructive"
      });
      setProvenanceChain(null);
    }
  });

  const handleSearch = () => {
    if (!tagId.trim()) {
      toast({
        title: "Tag ID Required",
        description: "Please enter a tag ID to search",
        variant: "destructive"
      });
      return;
    }
    searchProvenanceMutation.mutate(tagId.trim());
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    const Icon = EVENT_ICONS[eventType as keyof typeof EVENT_ICONS] || Package;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Provenance Chain Tracker
          </CardTitle>
          <CardDescription>
            Track the complete supply chain journey of any product using its tag ID
          </CardDescription>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <strong>Note:</strong> Product tracking is automatic through the scanning system integration. This manual search is for testing and verification purposes.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="tagId">Product Tag ID</Label>
              <Input
                id="tagId"
                placeholder="e.g., TAG-001-2024"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searchProvenanceMutation.isPending}
              className="mt-6"
            >
              {searchProvenanceMutation.isPending ? "Searching..." : "Track"}
            </Button>
          </div>
          
          {/* Sample Tag IDs for Testing */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sample Tag IDs (for testing):</Label>
            <div className="flex flex-wrap gap-2">
              {['TAG-001-2024', 'TAG-002-2024', 'TAG-003-2024'].map(sampleTag => (
                <Button
                  key={sampleTag}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTagId(sampleTag);
                    searchProvenanceMutation.mutate(sampleTag);
                  }}
                  disabled={searchProvenanceMutation.isPending}
                >
                  {sampleTag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {provenanceChain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Provenance Chain: {provenanceChain.tagId}</span>
              <Badge variant={provenanceChain.verified ? "default" : "secondary"}>
                {provenanceChain.verified ? "Fully Verified" : "Partial Verification"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {provenanceChain.totalEvents} events tracked on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {provenanceChain.events.map((event, index) => (
                <div key={event.id} className="relative">
                  {index < provenanceChain.events.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {getEventIcon(event.eventType)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{event.eventType}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          {event.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Event ID:</span> {event.eventId}
                        </div>
                        <div>
                          <span className="font-medium">Company:</span> {event.companyId}
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span> {formatTimestamp(event.ts)}
                        </div>
                        <div>
                          <span className="font-medium">Fee:</span> {event.fee} KAS
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Transaction:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {event.txid}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Open Kaspa explorer in new tab
                            window.open(`https://explorer.kaspa.org/txs/${event.txid}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {event.transaction && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Confirmations:</span> {event.transaction.confirmations}
                          {event.transaction.blockHash && (
                            <>
                              <span className="ml-4 font-medium">Block:</span> 
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">
                                {event.transaction.blockHash.slice(0, 16)}...
                              </code>
                            </>
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
      )}

      {/* Sample Tag IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Tag IDs</CardTitle>
          <CardDescription>
            Try these sample tag IDs to see the provenance tracking in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {["TAG-001-2024", "TAG-002-2024", "TAG-003-2024"].map(sampleTag => (
              <Button
                key={sampleTag}
                variant="outline"
                onClick={() => {
                  setTagId(sampleTag);
                  searchProvenanceMutation.mutate(sampleTag);
                }}
                className="justify-start"
              >
                {sampleTag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}