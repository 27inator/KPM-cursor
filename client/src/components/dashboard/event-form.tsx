import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Company {
  id: number;
  companyId: string;
  name: string;
  commitEventTypes: string[];
}

interface EventFormProps {
  companies: Company[];
}

const EVENT_TYPES = [
  { value: "FARM", label: "Farm Production", icon: Package },
  { value: "SHIP", label: "Shipping", icon: Truck },
  { value: "QC", label: "Quality Control", icon: CheckCircle },
  { value: "RETAIL", label: "Retail", icon: AlertCircle },
];

export default function EventForm({ companies }: EventFormProps) {
  const [formData, setFormData] = useState({
    companyId: "",
    tagId: "",
    eventType: "",
    blobCid: "",
    leafHash: "",
    merkleRoot: "",
    status: "pending"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/events', {
        ...eventData,
        eventId: `evt_${Date.now()}`,
        ts: Math.floor(Date.now() / 1000),
        fee: 0.001
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Event Created",
        description: `Event ${data.eventId} created and submitted to blockchain`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      // Reset form
      setFormData({
        companyId: "",
        tagId: "",
        eventType: "",
        blobCid: "",
        leafHash: "",
        merkleRoot: "",
        status: "pending"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Event Creation Failed",
        description: error.message || "Failed to create event",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.tagId || !formData.eventType) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createEventMutation.mutate(formData);
  };

  const selectedCompany = companies.find(c => c.companyId === formData.companyId);
  const availableEventTypes = selectedCompany 
    ? EVENT_TYPES.filter(et => selectedCompany.commitEventTypes.includes(et.value))
    : EVENT_TYPES;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Supply Chain Event
        </CardTitle>
        <CardDescription>
          Record a new supply chain event and commit it to the Kaspa blockchain
        </CardDescription>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">
          <strong>Note:</strong> Event creation is typically automatic through scanning systems. This manual form is for testing and administrative purposes.
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value, eventType: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.companyId}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag ID */}
          <div className="space-y-2">
            <Label htmlFor="tagId">Product Tag ID *</Label>
            <Input
              id="tagId"
              placeholder="e.g., TAG-001-2024"
              value={formData.tagId}
              onChange={(e) => setFormData(prev => ({ ...prev, tagId: e.target.value }))}
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
              disabled={!selectedCompany}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {availableEventTypes.map(eventType => {
                  const Icon = eventType.icon;
                  return (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {eventType.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Available Event Types for Selected Company */}
          {selectedCompany && (
            <div className="space-y-2">
              <Label>Available Event Types for {selectedCompany.name}</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCompany.commitEventTypes.map(eventType => (
                  <Badge key={eventType} variant="secondary">
                    {eventType}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Optional Fields */}
          <div className="space-y-2">
            <Label htmlFor="blobCid">IPFS Blob CID (optional)</Label>
            <Input
              id="blobCid"
              placeholder="e.g., QmXyZ..."
              value={formData.blobCid}
              onChange={(e) => setFormData(prev => ({ ...prev, blobCid: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leafHash">Leaf Hash (optional)</Label>
              <Input
                id="leafHash"
                placeholder="Generated automatically if empty"
                value={formData.leafHash}
                onChange={(e) => setFormData(prev => ({ ...prev, leafHash: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merkleRoot">Merkle Root (optional)</Label>
              <Input
                id="merkleRoot"
                placeholder="Generated automatically if empty"
                value={formData.merkleRoot}
                onChange={(e) => setFormData(prev => ({ ...prev, merkleRoot: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? "Creating Event..." : "Create Event & Submit to Blockchain"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}