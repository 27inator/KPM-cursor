import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Shield, Eye, Zap, History, AlertCircle, CheckCircle, Info, Save } from "lucide-react";
import { EVENT_TYPES, VISIBLE_FIELDS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number;
  companyId: string;
  name: string;
  visibleFields: string[];
  commitEventTypes: string[];
  status: string;
  walletAddress: string;
  balance: number;
  autoFundEnabled: boolean;
}

interface PolicyAudit {
  id: number;
  companyId: string;
  actionType: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  adminUserId: string;
  reason: string;
  createdAt: string;
}

interface PolicySettingsFormProps {
  companyId: string | null;
}

export function PolicySettingsForm({ companyId }: PolicySettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localVisibleFields, setLocalVisibleFields] = useState<string[]>([]);
  const [localCommitEventTypes, setLocalCommitEventTypes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });

  // Fetch policy audits for this company
  const { data: audits = [] } = useQuery<PolicyAudit[]>({
    queryKey: [`/api/policy/audits/${companyId}`],
    enabled: !!companyId,
  });

  // Policy update mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/companies/${companyId}/policy`, {
        visibleFields: localVisibleFields,
        commitEventTypes: localCommitEventTypes,
        adminUserId: companyId, // Company is updating their own policy
        reason: 'Company self-service policy update'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Policy updated successfully",
        description: "Your policy settings have been saved.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/policy/audits/${companyId}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update policy",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy settings...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Company not found</p>
      </div>
    );
  }

  // Initialize local state when company data loads
  if (company && localVisibleFields.length === 0 && localCommitEventTypes.length === 0) {
    setLocalVisibleFields(company.visibleFields || []);
    setLocalCommitEventTypes(company.commitEventTypes || []);
  }

  const getFieldDescription = (field: string) => {
    const descriptions: Record<string, string> = {
      stage: "Current supply chain stage",
      location: "Geographic location data",
      timestamp: "Event timestamps",
      temperature: "Temperature readings",
      humidity: "Humidity measurements",
      handler: "Personnel information",
      qualityScore: "Quality assessment scores",
      certifications: "Certification data",
      notes: "Additional notes and comments"
    };
    return descriptions[field] || "Field data";
  };

  const getEventTypeDescription = (eventType: string) => {
    const descriptions: Record<string, string> = {
      FARM: "Farm harvest and collection events",
      PROCESSING: "Processing and manufacturing events",
      WAREHOUSE: "Warehouse storage and handling",
      TRANSPORT: "Transportation and logistics",
      RETAIL: "Retail and distribution events",
      PURCHASE: "Consumer purchase events",
      QC_CHECK: "Quality control inspections",
      INSPECTION: "Regulatory inspections"
    };
    return descriptions[eventType] || "Event type";
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "field_visibility": return "bg-blue-100 text-blue-800";
      case "event_type_change": return "bg-green-100 text-green-800";
      case "policy_update": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toggleVisibleField = (field: string) => {
    const newFields = localVisibleFields.includes(field)
      ? localVisibleFields.filter(f => f !== field)
      : [...localVisibleFields, field];
    setLocalVisibleFields(newFields);
    setHasChanges(true);
  };

  const toggleCommitEventType = (eventType: string) => {
    const newEventTypes = localCommitEventTypes.includes(eventType)
      ? localCommitEventTypes.filter(t => t !== eventType)
      : [...localCommitEventTypes, eventType];
    setLocalCommitEventTypes(newEventTypes);
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePolicyMutation.mutate();
  };

  const handleReset = () => {
    setLocalVisibleFields(company.visibleFields || []);
    setLocalCommitEventTypes(company.commitEventTypes || []);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Policy Settings</h1>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Current Policy
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Change History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Save Changes Bar */}
          {hasChanges && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">You have unsaved changes</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleReset}
                      disabled={updatePolicyMutation.isPending}
                    >
                      Reset
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={updatePolicyMutation.isPending}
                    >
                      {updatePolicyMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Your company's current configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Company Name</span>
                    <p className="text-sm">{company.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Company ID</span>
                    <p className="text-sm font-mono">{company.companyId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <Badge variant={company.status === "active" ? "default" : "secondary"}>
                      {company.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Policy Control</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Self-Managed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visible Fields Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visible Fields Policy
                </CardTitle>
                <CardDescription>
                  Fields that are visible to consumers when they scan your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {VISIBLE_FIELDS.map((field) => (
                    <div key={field} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium capitalize text-sm">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getFieldDescription(field)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={localVisibleFields.includes(field)}
                          onCheckedChange={() => toggleVisibleField(field)}
                        />
                        <span className="text-sm">
                          {localVisibleFields.includes(field) ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Blockchain Commit Policy
              </CardTitle>
              <CardDescription>
                Event types that are automatically committed to the Kaspa blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EVENT_TYPES.map((eventType) => (
                  <div key={eventType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{eventType}</div>
                      <div className="text-xs text-gray-500">
                        {getEventTypeDescription(eventType)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={localCommitEventTypes.includes(eventType)}
                        onCheckedChange={() => toggleCommitEventType(eventType)}
                      />
                      <span className="text-sm">
                        {localCommitEventTypes.includes(eventType) ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Self-Service Policy Management</h3>
                  <p className="text-sm text-green-700 mt-1">
                    You can now manage your own policy settings directly. Make changes to which fields are visible to consumers 
                    and which event types are committed to the blockchain. All changes are automatically logged for compliance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Change History</CardTitle>
              <CardDescription>
                Track all policy changes made to your company's configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No policy changes recorded for your company
                  </div>
                ) : (
                  audits.map((audit) => (
                    <div key={audit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionTypeColor(audit.actionType)}>
                            {audit.actionType.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm font-medium">{audit.fieldName}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(audit.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-600">Previous Value:</span>
                          <div className="bg-red-50 p-2 rounded mt-1 text-red-700 text-xs">
                            {audit.oldValue}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">New Value:</span>
                          <div className="bg-green-50 p-2 rounded mt-1 text-green-700 text-xs">
                            {audit.newValue}
                          </div>
                        </div>
                      </div>
                      
                      {audit.reason && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <span className="font-medium text-gray-600">Reason for Change:</span>
                          <p className="mt-1 text-gray-700">{audit.reason}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                        Changed by administrator: {audit.adminUserId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CompanyPolicySettings() {
  const companyId = localStorage.getItem("companyId");
  return <PolicySettingsForm companyId={companyId} />;
}