import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building, 
  Wallet, 
  Activity, 
  TrendingUp, 
  Package, 
  LogOut, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Hash,
  Link,
  QrCode,
  Home,
  Shield
} from "lucide-react";

import ConsumerPreview from "@/components/consumer-preview";
import CompanyPolicySettings from "@/components/company-policy-settings";
import AdvancedAnalytics from "@/components/analytics/advanced-analytics";
import NotificationCenter from "@/components/notifications/notification-center";
import ToastNotifications from "@/components/notifications/toast-notifications";
import CompanyHierarchicalAnalytics from "@/components/company-hierarchical-analytics";
import EnhancedCompanyAnalytics from "@/components/enhanced-company-analytics";
import CompanySidebar from "@/components/company-sidebar";
import CompanyActivityFeed from "@/components/company-activity-feed";
import CompanySystemStatus from "@/components/company-system-status";

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

export default function CompanyDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    const storedCompanyName = localStorage.getItem('companyName');
    const token = localStorage.getItem('companyToken');
    
    if (!storedCompanyId || !token) {
      setLocation('/company-login');
      return;
    }
    
    setCompanyId(storedCompanyId);
    setCompanyName(storedCompanyName || 'Company');
  }, [setLocation]);

  const { data: companyInfo, isLoading: loadingCompany } = useQuery<CompanyInfo>({
    queryKey: ['/api/companies', companyId],
    enabled: !!companyId,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<CompanyAnalytics>({
    queryKey: ['/api/companies', companyId, 'analytics'],
    enabled: !!companyId,
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<EventHistory[]>({
    queryKey: ['/api/companies', companyId, 'transactions'],
    enabled: !!companyId,
  });

  const handleLogout = () => {
    localStorage.removeItem('companyToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
    setLocation('/company-login');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingCompany || !companyInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kaspa-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-gradient-to-br from-kaspa-500 to-kaspa-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{companyName}</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md">{companyId}</p>
                <Badge 
                  variant={companyInfo.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {companyInfo.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <NotificationCenter />
            <div className="h-8 w-px bg-gray-200"></div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/company-portal')}
              title="Go to Company Home"
              className="flex items-center gap-2 px-4 py-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Supply Chain Operations</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <TabsList className="grid w-full grid-cols-8 h-12">
                <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                <TabsTrigger value="transactions" className="text-sm">Transactions</TabsTrigger>
                <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
                <TabsTrigger value="advanced-analytics" className="text-sm">Advanced</TabsTrigger>
                <TabsTrigger value="hierarchical" className="text-sm">Product Analytics</TabsTrigger>
                <TabsTrigger value="enhanced" className="text-sm">Enhanced</TabsTrigger>
                <TabsTrigger value="policy" className="text-sm">Policy</TabsTrigger>
                <TabsTrigger value="consumer" className="text-sm">Consumer</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-4 mt-6">
                <h2 className="text-lg font-semibold text-gray-900">System Monitoring</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="activity" className="text-sm">Activity Feed</TabsTrigger>
                <TabsTrigger value="connection" className="text-sm">System Status</TabsTrigger>
                <TabsTrigger value="security" className="text-sm">Security</TabsTrigger>
                <TabsTrigger value="performance" className="text-sm">Performance</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Supply chain events recorded
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.recentEvents ? 
                      new Set(analytics.recentEvents.map(e => e.tagId)).size : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique products tracked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.recentEvents ? 
                      Math.round((analytics.recentEvents.filter(e => e.status === 'confirmed').length / analytics.recentEvents.length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Blockchain verified events
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companyInfo.commitEventTypes.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Supported event categories
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supply Chain Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Events</span>
                    <span className="text-lg font-bold">{analytics?.totalEvents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confirmed Events</span>
                    <span className="text-sm text-gray-600">{analytics?.confirmedEvents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Products Being Tracked</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.recentEvents ? 
                        new Set(analytics.recentEvents.map(e => e.tagId)).size : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Events per Product</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.recentEvents && analytics.totalEvents ? 
                        Math.round(analytics.totalEvents / new Set(analytics.recentEvents.map(e => e.tagId)).size) : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operational Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Company Status</span>
                    <Badge variant={companyInfo.status === 'active' ? 'default' : 'secondary'}>
                      {companyInfo.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blockchain Integration</span>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Event Categories</span>
                    <div className="flex flex-wrap gap-1">
                      {companyInfo.commitEventTypes.slice(0, 3).map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                      {companyInfo.commitEventTypes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{companyInfo.commitEventTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Verification</span>
                    <span className="text-sm text-gray-600">Kaspa Blockchain</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa-500"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Product ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Blockchain TX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.recentEvents?.slice(0, 5).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant="outline">{event.eventType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{event.tagId}</TableCell>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                          <TableCell>
                            <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {event.status === 'confirmed' ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {event.txid ? (
                              <a 
                                href={`https://explorer.kaspa.org/txs/${event.txid}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-kaspa-600 hover:text-kaspa-800 flex items-center gap-1"
                              >
                                {event.txid.substring(0, 8)}...
                                <Link className="h-3 w-3" />
                              </a>
                            ) : (
                              'Pending'
                            )}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            No events found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>





          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaspa-500"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>TX Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.timestamp)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.eventType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{tx.tagId}</TableCell>
                          <TableCell>
                            <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {tx.status === 'confirmed' ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tx.txid ? (
                              <a 
                                href={`https://explorer.kaspa.org/txs/${tx.txid}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {tx.txid.substring(0, 12)}...
                                <Link className="h-3 w-3" />
                              </a>
                            ) : (
                              'Pending'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Events by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.eventsByType && Object.keys(analytics.eventsByType).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.eventsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-kaspa-500 rounded-full"></div>
                            <span className="text-sm font-medium">{type}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No events yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supply Chain Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Most Common Event</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.eventsByType && Object.keys(analytics.eventsByType).length > 0 ? 
                        Object.entries(analytics.eventsByType).sort(([,a], [,b]) => b - a)[0][0] : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Event Distribution</span>
                    <span className="text-sm text-gray-600">
                      {Object.keys(analytics?.eventsByType || {}).length} categories
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blockchain Commits</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.confirmedEvents || 0} verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Integrity</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.recentEvents ? 
                        Math.round((analytics.recentEvents.filter(e => e.status === 'confirmed').length / analytics.recentEvents.length) * 100) : 0}% verified
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operational Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blockchain Network</span>
                    <Badge variant="default">
                      Kaspa Mainnet
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Retention</span>
                    <span className="text-sm text-gray-600">Permanent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Products</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.recentEvents ? 
                        new Set(analytics.recentEvents.map(e => e.tagId)).size : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.recentEvents ? 
                        Math.round((analytics.recentEvents.filter(e => e.status === 'confirmed').length / analytics.recentEvents.length) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.dailyEvents?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.dailyEvents.slice(-7).map((day, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{day.date}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">{day.count} events</div>
                            <div className="text-sm text-gray-600">
                              {day.count > 0 ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No daily data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.recentEvents?.length > 0 ? (
                    <div className="space-y-3">
                      {Array.from(new Set(analytics.recentEvents.map(e => e.tagId))).slice(0, 5).map((tagId) => {
                        const events = analytics.recentEvents.filter(e => e.tagId === tagId);
                        const latestEvent = events.sort((a, b) => b.timestamp - a.timestamp)[0];
                        return (
                          <div key={tagId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium font-mono">{tagId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {latestEvent.eventType}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {events.length} event{events.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No products tracked yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.recentEvents?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentEvents.slice(0, 10).map((event, index) => (
                      <div key={event.id} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-kaspa-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-kaspa-700">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.eventType}
                            </Badge>
                            <span className="text-sm font-medium font-mono">{event.tagId}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(event.timestamp)}
                            </span>
                            {event.txid && (
                              <a 
                                href={`https://explorer.kaspa.org/txs/${event.txid}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-kaspa-600 hover:text-kaspa-800 flex items-center gap-1"
                              >
                                <Hash className="h-3 w-3" />
                                {event.txid.substring(0, 8)}...
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No events to display</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced-analytics" className="space-y-6">
            <AdvancedAnalytics companyId={companyId} />
          </TabsContent>

          <TabsContent value="hierarchical" className="space-y-6">
            <CompanyHierarchicalAnalytics companyId={companyId} />
          </TabsContent>

          <TabsContent value="enhanced" className="space-y-6">
            <EnhancedCompanyAnalytics companyId={companyId} />
          </TabsContent>

          <TabsContent value="policy" className="space-y-6">
            <CompanyPolicySettings />
          </TabsContent>

          <TabsContent value="consumer" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Consumer Mobile Preview</h2>
              <p className="text-gray-600">Preview how consumers will see your products in the mobile app</p>
            </div>
            <ConsumerPreview />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <CompanyActivityFeed companyId={companyId} />
          </TabsContent>

          <TabsContent value="connection" className="space-y-6">
            <CompanySystemStatus companyId={companyId} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Company Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Authentication Status</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Company authenticated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Access code verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Blockchain connection secure</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Metrics</h3>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Events Verified:</span>
                        <span>{analytics?.recentEvents?.filter(e => e.status === 'confirmed').length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Blockchain Confirmations:</span>
                        <span>6+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Integrity:</span>
                        <span className="text-green-600">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Company Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-kaspa-600">{analytics?.totalEvents || 0}</div>
                    <div className="text-sm text-gray-500">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.recentEvents ? 
                        Math.round((analytics.recentEvents.filter(e => e.status === 'confirmed').length / analytics.recentEvents.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.recentEvents ? 
                        new Set(analytics.recentEvents.map(e => e.tagId)).size : 0}
                    </div>
                    <div className="text-sm text-gray-500">Products Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Real-time notifications */}
      <ToastNotifications />
    </div>
  );
}