import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Shield, Settings, History, Bell } from "lucide-react";
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

interface SystemAlert {
  id: number;
  alertType: string;
  severity: string;
  message: string;
  companyId?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  createdAt: string;
}

export default function PolicyManagement() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedVisibleFields, setSelectedVisibleFields] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/dashboard/companies"],
  });

  // Fetch policy audits
  const { data: audits = [] } = useQuery<PolicyAudit[]>({
    queryKey: ["/api/policy/audits"],
  });

  // Fetch system alerts
  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (data: { companyId: string; visibleFields: string[]; commitEventTypes: string[]; reason: string }) => {
      return apiRequest(`/api/companies/${data.companyId}/policy`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Policy Updated",
        description: "Company policy has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policy/audits"] });
      setChangeReason("");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update company policy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/alerts/${alertId}/acknowledge`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  // Update form when company is selected
  useEffect(() => {
    if (selectedCompany) {
      setSelectedVisibleFields(selectedCompany.visibleFields || []);
      setSelectedEventTypes(selectedCompany.commitEventTypes || []);
    }
  }, [selectedCompany]);

  const handleUpdatePolicy = () => {
    if (!selectedCompany) return;
    
    updatePolicyMutation.mutate({
      companyId: selectedCompany.companyId,
      visibleFields: selectedVisibleFields,
      commitEventTypes: selectedEventTypes,
      reason: changeReason,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "field_visibility": return "bg-blue-100 text-blue-800";
      case "event_type_change": return "bg-green-100 text-green-800";
      case "policy_update": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Policy Management</h1>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Policy Editor
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            System Alerts
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Company</CardTitle>
                <CardDescription>Choose a company to edit its policy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companiesLoading ? (
                  <div className="text-center py-4">Loading companies...</div>
                ) : (
                  <div className="space-y-2">
                    {companies.map((company: Company) => (
                      <div
                        key={company.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCompany?.id === company.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedCompany(company)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-gray-500">{company.companyId}</div>
                          </div>
                          <Badge variant={company.status === "active" ? "default" : "secondary"}>
                            {company.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policy Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Configuration</CardTitle>
                <CardDescription>
                  {selectedCompany ? `Configure policy for ${selectedCompany.name}` : "Select a company to configure policy"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedCompany ? (
                  <>
                    {/* Visible Fields */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Visible Fields</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {VISIBLE_FIELDS.map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                              id={field}
                              checked={selectedVisibleFields.includes(field)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVisibleFields([...selectedVisibleFields, field]);
                                } else {
                                  setSelectedVisibleFields(selectedVisibleFields.filter(f => f !== field));
                                }
                              }}
                            />
                            <Label htmlFor={field} className="text-sm capitalize">
                              {field.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Types */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Commit Event Types</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {EVENT_TYPES.map((eventType) => (
                          <div key={eventType} className="flex items-center space-x-2">
                            <Checkbox
                              id={eventType}
                              checked={selectedEventTypes.includes(eventType)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEventTypes([...selectedEventTypes, eventType]);
                                } else {
                                  setSelectedEventTypes(selectedEventTypes.filter(t => t !== eventType));
                                }
                              }}
                            />
                            <Label htmlFor={eventType} className="text-sm">
                              {eventType}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Change Reason */}
                    <div className="space-y-2">
                      <Label htmlFor="reason">Change Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for policy change..."
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleUpdatePolicy}
                      disabled={updatePolicyMutation.isPending}
                      className="w-full"
                    >
                      {updatePolicyMutation.isPending ? "Updating..." : "Update Policy"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a company to configure its policy settings
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Audit Trail</CardTitle>
              <CardDescription>Track all policy changes and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No policy changes recorded</div>
                ) : (
                  audits.map((audit) => (
                    <div key={audit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionTypeColor(audit.actionType)}>
                            {audit.actionType.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm font-medium">{audit.companyId}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(audit.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Field:</strong> {audit.fieldName}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Old Value:</strong>
                          <div className="bg-red-50 p-2 rounded mt-1 text-red-700">
                            {audit.oldValue}
                          </div>
                        </div>
                        <div>
                          <strong>New Value:</strong>
                          <div className="bg-green-50 p-2 rounded mt-1 text-green-700">
                            {audit.newValue}
                          </div>
                        </div>
                      </div>
                      {audit.reason && (
                        <div className="mt-2 text-sm">
                          <strong>Reason:</strong> {audit.reason}
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        Changed by: {audit.adminUserId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Monitor system health and performance alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No system alerts</div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${
                        alert.acknowledged ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium">{alert.alertType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          {alert.acknowledged ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </div>
                      {alert.companyId && (
                        <div className="text-sm text-gray-500 mb-2">
                          Company: {alert.companyId}
                        </div>
                      )}
                      {alert.acknowledged ? (
                        <div className="text-sm text-green-600">
                          Acknowledged by: {alert.acknowledgedBy}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                          disabled={acknowledgeAlertMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      )}
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