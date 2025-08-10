import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Building, MessageSquare, Calendar, Clock, CheckCircle, AlertTriangle, Share2 } from 'lucide-react';

interface SupplyChainPartner {
  id: string;
  name: string;
  type: 'farm' | 'processor' | 'distributor' | 'retailer' | 'logistics' | 'certification';
  role: string;
  location: string;
  connectionStatus: 'connected' | 'pending' | 'disconnected';
  dataSharing: 'full' | 'limited' | 'minimal';
  lastActivity: string;
  totalEvents: number;
  verificationLevel: 'high' | 'medium' | 'low';
  complianceScore: number;
  documentsShared: number;
  blockchainCommits: number;
}

interface CollaborationRequest {
  id: string;
  fromPartner: string;
  toPartner: string;
  requestType: 'data_access' | 'verification' | 'certification' | 'audit' | 'documentation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  dueDate: string;
  responseDate?: string;
  notes?: string;
  attachments: string[];
}

interface DataSharingAgreement {
  id: string;
  partnerA: string;
  partnerB: string;
  agreementType: 'bilateral' | 'multilateral' | 'consortium';
  dataTypes: string[];
  permissions: {
    read: boolean;
    write: boolean;
    share: boolean;
    audit: boolean;
  };
  validUntil: string;
  status: 'active' | 'expired' | 'suspended';
  blockchainHash: string;
  lastUpdated: string;
  usageCount: number;
}

export default function SupplyChainCollaboration() {
  const [activeTab, setActiveTab] = useState('partners');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const partners: SupplyChainPartner[] = [
    {
      id: '1',
      name: 'Green Valley Farms',
      type: 'farm',
      role: 'Organic Produce Supplier',
      location: 'California, USA',
      connectionStatus: 'connected',
      dataSharing: 'full',
      lastActivity: '2025-01-17T10:30:00Z',
      totalEvents: 1247,
      verificationLevel: 'high',
      complianceScore: 96,
      documentsShared: 234,
      blockchainCommits: 198
    },
    {
      id: '2',
      name: 'FreshPack Processing',
      type: 'processor',
      role: 'Food Processing & Packaging',
      location: 'Oregon, USA',
      connectionStatus: 'connected',
      dataSharing: 'full',
      lastActivity: '2025-01-17T09:45:00Z',
      totalEvents: 892,
      verificationLevel: 'high',
      complianceScore: 94,
      documentsShared: 187,
      blockchainCommits: 156
    },
    {
      id: '3',
      name: 'ColdChain Logistics',
      type: 'logistics',
      role: 'Temperature-Controlled Transport',
      location: 'Nevada, USA',
      connectionStatus: 'connected',
      dataSharing: 'limited',
      lastActivity: '2025-01-17T11:15:00Z',
      totalEvents: 634,
      verificationLevel: 'medium',
      complianceScore: 89,
      documentsShared: 156,
      blockchainCommits: 134
    },
    {
      id: '4',
      name: 'Organic Certification Inc',
      type: 'certification',
      role: 'Organic Certification Body',
      location: 'Washington, USA',
      connectionStatus: 'connected',
      dataSharing: 'minimal',
      lastActivity: '2025-01-17T08:20:00Z',
      totalEvents: 345,
      verificationLevel: 'high',
      complianceScore: 100,
      documentsShared: 89,
      blockchainCommits: 89
    },
    {
      id: '5',
      name: 'Regional Distribution Co',
      type: 'distributor',
      role: 'Regional Food Distribution',
      location: 'Colorado, USA',
      connectionStatus: 'pending',
      dataSharing: 'limited',
      lastActivity: '2025-01-16T16:30:00Z',
      totalEvents: 267,
      verificationLevel: 'medium',
      complianceScore: 87,
      documentsShared: 67,
      blockchainCommits: 45
    }
  ];

  const collaborationRequests: CollaborationRequest[] = [
    {
      id: '1',
      fromPartner: 'Green Valley Farms',
      toPartner: 'Organic Certification Inc',
      requestType: 'certification',
      title: 'Organic Certification Renewal',
      description: 'Request for annual organic certification renewal with updated documentation',
      priority: 'high',
      status: 'pending',
      requestedAt: '2025-01-17T09:00:00Z',
      dueDate: '2025-01-24T17:00:00Z',
      attachments: ['soil_test_2025.pdf', 'harvest_records.xlsx', 'organic_practices.docx']
    },
    {
      id: '2',
      fromPartner: 'FreshPack Processing',
      toPartner: 'ColdChain Logistics',
      requestType: 'data_access',
      title: 'Temperature Data Access',
      description: 'Request access to temperature monitoring data for quality assurance audit',
      priority: 'medium',
      status: 'approved',
      requestedAt: '2025-01-16T14:30:00Z',
      dueDate: '2025-01-19T12:00:00Z',
      responseDate: '2025-01-17T10:15:00Z',
      notes: 'Approved for 48-hour access window',
      attachments: ['audit_requirements.pdf']
    },
    {
      id: '3',
      fromPartner: 'Regional Distribution Co',
      toPartner: 'Green Valley Farms',
      requestType: 'verification',
      title: 'Origin Verification',
      description: 'Verify origin claims for organic tomato batch #GT-2025-001',
      priority: 'high',
      status: 'completed',
      requestedAt: '2025-01-15T11:20:00Z',
      dueDate: '2025-01-17T10:00:00Z',
      responseDate: '2025-01-16T15:45:00Z',
      notes: 'Verification completed with blockchain proof',
      attachments: ['batch_verification.pdf', 'blockchain_proof.json']
    }
  ];

  const dataSharingAgreements: DataSharingAgreement[] = [
    {
      id: '1',
      partnerA: 'Green Valley Farms',
      partnerB: 'FreshPack Processing',
      agreementType: 'bilateral',
      dataTypes: ['harvest_records', 'quality_tests', 'certification_docs'],
      permissions: {
        read: true,
        write: false,
        share: true,
        audit: true
      },
      validUntil: '2025-12-31T23:59:59Z',
      status: 'active',
      blockchainHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef',
      lastUpdated: '2025-01-17T10:30:00Z',
      usageCount: 247
    },
    {
      id: '2',
      partnerA: 'FreshPack Processing',
      partnerB: 'ColdChain Logistics',
      agreementType: 'bilateral',
      dataTypes: ['processing_logs', 'temperature_data', 'packaging_info'],
      permissions: {
        read: true,
        write: false,
        share: false,
        audit: true
      },
      validUntil: '2025-06-30T23:59:59Z',
      status: 'active',
      blockchainHash: '0xb2c3d4e5f6789012345678901234567890abcdef1',
      lastUpdated: '2025-01-17T09:45:00Z',
      usageCount: 156
    },
    {
      id: '3',
      partnerA: 'Organic Certification Inc',
      partnerB: 'Green Valley Farms',
      agreementType: 'bilateral',
      dataTypes: ['certification_status', 'audit_results', 'compliance_reports'],
      permissions: {
        read: true,
        write: true,
        share: false,
        audit: true
      },
      validUntil: '2025-12-31T23:59:59Z',
      status: 'active',
      blockchainHash: '0xc3d4e5f6789012345678901234567890abcdef12',
      lastUpdated: '2025-01-17T08:20:00Z',
      usageCount: 89
    }
  ];

  const getConnectionBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-green-500">Connected</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'disconnected': return <Badge className="bg-red-500">Disconnected</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getDataSharingBadge = (level: string) => {
    switch (level) {
      case 'full': return <Badge className="bg-green-500">Full Access</Badge>;
      case 'limited': return <Badge className="bg-yellow-500">Limited</Badge>;
      case 'minimal': return <Badge className="bg-orange-500">Minimal</Badge>;
      default: return <Badge className="bg-gray-500">None</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'active':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'rejected':
      case 'expired':
      case 'suspended':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low': return <Badge className="bg-green-500">Low</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge className="bg-green-500">High Trust</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium Trust</Badge>;
      case 'low': return <Badge className="bg-orange-500">Low Trust</Badge>;
      default: return <Badge className="bg-gray-500">Unverified</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const connectedPartners = partners.filter(p => p.connectionStatus === 'connected').length;
  const pendingRequests = collaborationRequests.filter(r => r.status === 'pending').length;
  const activeAgreements = dataSharingAgreements.filter(a => a.status === 'active').length;
  const avgComplianceScore = partners.reduce((sum, p) => sum + p.complianceScore, 0) / partners.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supply Chain Collaboration</h2>
          <p className="text-muted-foreground">
            Partner network management and collaborative transparency initiatives
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Add Partner</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{connectedPartners}</div>
            <p className="text-xs text-muted-foreground">
              Out of {partners.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgreements}</div>
            <p className="text-xs text-muted-foreground">
              Data sharing agreements
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgComplianceScore)}`}>
              {avgComplianceScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Network average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partners">Partner Network</TabsTrigger>
          <TabsTrigger value="requests">Collaboration Requests</TabsTrigger>
          <TabsTrigger value="agreements">Data Sharing Agreements</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <div className="grid gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getConnectionBadge(partner.connectionStatus)}
                      {getVerificationBadge(partner.verificationLevel)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {partner.role} • {partner.location}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{partner.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{partner.documentsShared}</div>
                      <div className="text-xs text-muted-foreground">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{partner.blockchainCommits}</div>
                      <div className="text-xs text-muted-foreground">Blockchain</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(partner.complianceScore)}`}>
                        {partner.complianceScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Compliance</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Data Sharing:</span>
                      {getDataSharingBadge(partner.dataSharing)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last Activity: {new Date(partner.lastActivity).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Type: {partner.type.charAt(0).toUpperCase() + partner.type.slice(1)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm">
                        Manage Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {collaborationRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {request.fromPartner} → To: {request.toPartner}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{request.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {request.requestType.replace('_', ' ')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Requested:</span> {new Date(request.requestedAt).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Due:</span> {new Date(request.dueDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {request.responseDate && (
                        <div className="text-sm">
                          <span className="font-medium">Responded:</span> {new Date(request.responseDate).toLocaleString()}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Attachments:</span> {request.attachments.length}
                      </div>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Notes:</div>
                      <p className="text-sm text-blue-800">{request.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {request.attachments.map((attachment, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {request.status === 'pending' && (
                        <Button size="sm">
                          Respond
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agreements" className="space-y-4">
          <div className="grid gap-4">
            {dataSharingAgreements.map((agreement) => (
              <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-lg">Data Sharing Agreement</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(agreement.status)}
                      <Badge variant="outline" className="text-xs">
                        {agreement.agreementType}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agreement.partnerA} ↔ {agreement.partnerB}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agreement.permissions.read ? 'text-green-600' : 'text-gray-400'}`}>
                        Read
                      </div>
                      <div className="text-xs">{agreement.permissions.read ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agreement.permissions.write ? 'text-green-600' : 'text-gray-400'}`}>
                        Write
                      </div>
                      <div className="text-xs">{agreement.permissions.write ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agreement.permissions.share ? 'text-green-600' : 'text-gray-400'}`}>
                        Share
                      </div>
                      <div className="text-xs">{agreement.permissions.share ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agreement.permissions.audit ? 'text-green-600' : 'text-gray-400'}`}>
                        Audit
                      </div>
                      <div className="text-xs">{agreement.permissions.audit ? '✓' : '✗'}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Data Types:</div>
                    <div className="flex flex-wrap gap-1">
                      {agreement.dataTypes.map((type, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Blockchain Hash:</span> 
                      <code className="ml-1 text-xs">{agreement.blockchainHash.substring(0, 20)}...</code>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Usage Count:</span> {agreement.usageCount}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Valid until: {new Date(agreement.validUntil).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Agreement
                      </Button>
                      <Button size="sm">
                        Manage Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}