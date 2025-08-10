import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PolicySettingsForm } from "@/components/company-policy-settings";
import { 
  Building, 
  Package, 
  Plus, 
  Activity, 
  Wallet, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Settings,
  FileText,
  TrendingUp,
  DollarSign,
  Home,
  LogOut
} from "lucide-react";

const eventSchema = z.object({
  tagId: z.string().min(1, "Tag ID is required"),
  eventType: z.enum(["FARM", "PROCESSING", "SHIP", "WAREHOUSE", "RETAIL", "PURCHASE"]),
  payload: z.object({
    location: z.string().min(1, "Location is required"),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    notes: z.string().optional()
  })
});

interface CompanyInfo {
  id: number;
  companyId: string;
  name: string;
  walletAddress: string;
  balance: number;
  status: string;
  hdPathIndex: number;
  autoFundEnabled: boolean;
  visibleFields: string[];
  commitEventTypes: string[];
}

interface EventHistory {
  id: number;
  eventId: string;
  eventType: string;
  tagId: string;
  timestamp: number;
  status: string;
  txid: string;
  fee: number;
  leafHash: string;
  merkleRoot: string;
}

interface CompanyAnalytics {
  totalEvents: number;
  totalFees: number;
  averageFee: number;
  recentEvents: EventHistory[];
  eventsByType: Record<string, number>;
  dailyEvents: Array<{ date: string; count: number; fees: number }>;
}

export default function CompanyPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get logged-in company info from localStorage
  const companyId = localStorage.getItem('companyId');
  const companyName = localStorage.getItem('companyName');
  
  // Redirect to login if no company is logged in
  useEffect(() => {
    if (!companyId) {
      setLocation('/company-login');
    }
  }, [companyId, setLocation]);

  // Handle tab navigation from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'events', 'history', 'analytics', 'policy'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      tagId: "",
      eventType: "FARM",
      payload: {
        location: "",
        temperature: undefined,
        humidity: undefined,
        notes: ""
      }
    }
  });

  // Fetch company-specific data for the logged-in company
  const { data: companyData, isLoading: companyLoading } = useQuery<CompanyInfo>({
    queryKey: ['/api/companies', companyId],
    enabled: !!companyId,
  });

  // Fetch company analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<CompanyAnalytics>({
    queryKey: ['/api/companies', companyId, 'analytics'],
    enabled: !!companyId,
  });

  // Fetch company transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery<EventHistory[]>({
    queryKey: ['/api/companies', companyId, 'transactions'],
    enabled: !!companyId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: z.infer<typeof eventSchema>) => {
      const response = await apiRequest('POST', '/api/events', {
        companyId: companyId,
        tagId: eventData.tagId,
        eventType: eventData.eventType,
        ts: Math.floor(Date.now() / 1000),
        payload: eventData.payload
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event created successfully",
        description: "The event has been submitted to the blockchain",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId] });
    },
    onError: (error) => {
      toast({
        title: "Error creating event",
        description: "Failed to submit event to blockchain",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    if (!companyId) {
      toast({
        title: "No company logged in",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('companyToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
    setLocation('/company-login');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'low_balance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'FARM': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'SHIP': return 'bg-orange-100 text-orange-800';
      case 'WAREHOUSE': return 'bg-purple-100 text-purple-800';
      case 'RETAIL': return 'bg-pink-100 text-pink-800';
      case 'PURCHASE': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openKaspaExplorer = (txid: string) => {
    window.open(`https://explorer.kaspa.org/txs/${txid}`, '_blank');
  };

  if (companyLoading || !companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa-500"></div>
        <span className="ml-2">Loading company portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-kaspa-500 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                <p className="text-gray-600 mt-2">{companyId} • Company Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/company-portal')}
                title="Go to Company Home"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Company Dashboard */}
        {companyData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Create Event</TabsTrigger>
              <TabsTrigger value="history">Event History</TabsTrigger>
              <TabsTrigger value="analytics">Supply Chain Analytics</TabsTrigger>
              <TabsTrigger value="policy">Policy Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {companyData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Events</p>
                          <p className="text-2xl font-bold">{analytics?.totalEvents || 0}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Products Tracked</p>
                          <p className="text-2xl font-bold">{analytics?.recentEvents?.length || 0}</p>
                        </div>
                        <Package className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Event Types</p>
                          <p className="text-2xl font-bold">{Object.keys(analytics?.eventsByType || {}).length}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Status</p>
                          <Badge className={getStatusColor(companyData.status)}>
                            {companyData.status}
                          </Badge>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kaspa-500"></div>
                    </div>
                  ) : analytics?.recentEvents?.length ? (
                    <div className="space-y-4">
                      {analytics.recentEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={getEventTypeColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                            <div>
                              <p className="font-medium">{event.tagId}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openKaspaExplorer(event.txid)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent events</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Create Event Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Supply Chain Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="tagId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Tag ID</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., TAG-001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="eventType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="FARM">Farm/Harvest</SelectItem>
                                  <SelectItem value="PROCESSING">Processing</SelectItem>
                                  <SelectItem value="SHIP">Shipping</SelectItem>
                                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                                  <SelectItem value="RETAIL">Retail</SelectItem>
                                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="payload.location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Processing Facility A" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="payload.temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature (°C)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 4" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="payload.humidity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Humidity (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 60" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="payload.notes"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional information about this event..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createEventMutation.isPending}
                      >
                        {createEventMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Event...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Event History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Event History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kaspa-500"></div>
                    </div>
                  ) : transactions?.length ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className={getEventTypeColor(transaction.eventType)}>
                                {transaction.eventType}
                              </Badge>
                              <span className="font-medium">{transaction.tagId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {transaction.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openKaspaExplorer(transaction.txid)}
                                title="View blockchain proof"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Event ID: {transaction.eventId}</p>
                            <p>Date: {formatDate(transaction.timestamp)}</p>
                            <p>Blockchain Status: {transaction.status}</p>
                            <p>Proof Hash: {transaction.leafHash ? transaction.leafHash.substring(0, 20) : 'N/A'}...</p>
                            <p>Merkle Root: {transaction.merkleRoot ? transaction.merkleRoot.substring(0, 20) : 'N/A'}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No events found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Supply Chain Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Events</p>
                        <p className="text-2xl font-bold">{analytics?.totalEvents || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Unique Products</p>
                        <p className="text-2xl font-bold">{new Set(analytics?.recentEvents?.map(e => e.tagId) || []).size}</p>
                      </div>
                      <Package className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Event Types</p>
                        <p className="text-2xl font-bold">{Object.keys(analytics?.eventsByType || {}).length}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Supply Chain Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Events by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Events by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.eventsByType && Object.keys(analytics.eventsByType).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(analytics.eventsByType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getEventTypeColor(type)}>
                                {type}
                              </Badge>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No event data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.recentEvents && analytics.recentEvents.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.recentEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge className={getEventTypeColor(event.eventType)} variant="outline">
                                {event.eventType}
                              </Badge>
                              <span className="text-sm font-medium">{event.tagId}</span>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Product Journey Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Journey Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.recentEvents && analytics.recentEvents.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.recentEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-kaspa-100 rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-kaspa-600" />
                            </div>
                            <div>
                              <p className="font-medium">{event.tagId}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getEventTypeColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No product journeys tracked yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Policy Settings Tab */}
            <TabsContent value="policy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Policy Settings
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Configure which event types are committed to the blockchain and which product fields are visible to consumers.
                  </p>
                </CardHeader>
                <CardContent>
                  <PolicySettingsForm companyId={companyId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}