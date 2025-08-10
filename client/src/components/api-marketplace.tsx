import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Code, Zap, Star, Download, Settings, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: 'erp' | 'logistics' | 'crm' | 'analytics' | 'compliance' | 'payments';
  description: string;
  provider: string;
  version: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  rating: number;
  downloads: number;
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price: number;
    period: 'monthly' | 'yearly' | 'one-time';
  };
  features: string[];
  lastUpdate: string;
  compatibility: string[];
  documentation: string;
  support: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  response: string;
  rateLimit: string;
  authentication: string;
}

interface Usage {
  integrationId: string;
  requests: number;
  successRate: number;
  avgResponseTime: number;
  errors: number;
  lastUsed: string;
}

export default function APIMarketplace() {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const integrations: Integration[] = [
    {
      id: '1',
      name: 'SAP Business One',
      category: 'erp',
      description: 'Complete ERP integration for inventory, orders, and financial management',
      provider: 'SAP',
      version: '2.1.0',
      status: 'active',
      rating: 4.8,
      downloads: 1250,
      pricing: {
        type: 'paid',
        price: 299,
        period: 'monthly'
      },
      features: ['Real-time inventory sync', 'Order management', 'Financial reporting', 'Multi-currency support'],
      lastUpdate: '2024-12-15',
      compatibility: ['REST API', 'Webhook', 'SOAP'],
      documentation: 'https://docs.sap.com/kmp-integration',
      support: 'Enterprise support included'
    },
    {
      id: '2',
      name: 'FedEx Shipping API',
      category: 'logistics',
      description: 'Automated shipping labels, tracking, and delivery notifications',
      provider: 'FedEx',
      version: '1.8.3',
      status: 'active',
      rating: 4.6,
      downloads: 2100,
      pricing: {
        type: 'freemium',
        price: 0,
        period: 'monthly'
      },
      features: ['Label generation', 'Real-time tracking', 'Delivery notifications', 'Rate calculation'],
      lastUpdate: '2024-12-10',
      compatibility: ['REST API', 'Webhook'],
      documentation: 'https://developer.fedex.com/kmp',
      support: 'Community support'
    },
    {
      id: '3',
      name: 'Salesforce CRM',
      category: 'crm',
      description: 'Customer relationship management and sales pipeline integration',
      provider: 'Salesforce',
      version: '3.2.1',
      status: 'active',
      rating: 4.7,
      downloads: 1800,
      pricing: {
        type: 'paid',
        price: 150,
        period: 'monthly'
      },
      features: ['Lead management', 'Customer profiles', 'Sales analytics', 'Email automation'],
      lastUpdate: '2024-12-20',
      compatibility: ['REST API', 'GraphQL', 'Webhook'],
      documentation: 'https://developer.salesforce.com/kmp',
      support: 'Premium support included'
    },
    {
      id: '4',
      name: 'Tableau Analytics',
      category: 'analytics',
      description: 'Advanced data visualization and business intelligence',
      provider: 'Tableau',
      version: '2.5.0',
      status: 'pending',
      rating: 4.9,
      downloads: 950,
      pricing: {
        type: 'paid',
        price: 199,
        period: 'monthly'
      },
      features: ['Interactive dashboards', 'Real-time analytics', 'Data connectors', 'Custom reports'],
      lastUpdate: '2024-12-18',
      compatibility: ['REST API', 'JDBC', 'ODBC'],
      documentation: 'https://help.tableau.com/kmp',
      support: 'Enterprise support'
    },
    {
      id: '5',
      name: 'Stripe Payments',
      category: 'payments',
      description: 'Secure payment processing and subscription management',
      provider: 'Stripe',
      version: '4.1.2',
      status: 'active',
      rating: 4.8,
      downloads: 3200,
      pricing: {
        type: 'freemium',
        price: 0,
        period: 'monthly'
      },
      features: ['Payment processing', 'Subscription billing', 'Fraud protection', 'Multi-currency'],
      lastUpdate: '2024-12-22',
      compatibility: ['REST API', 'Webhook', 'SDK'],
      documentation: 'https://stripe.com/docs/kmp',
      support: 'Developer support'
    },
    {
      id: '6',
      name: 'ComplianceAI',
      category: 'compliance',
      description: 'AI-powered regulatory compliance monitoring and reporting',
      provider: 'ComplianceAI',
      version: '1.3.0',
      status: 'error',
      rating: 4.4,
      downloads: 680,
      pricing: {
        type: 'paid',
        price: 399,
        period: 'monthly'
      },
      features: ['Automated compliance checks', 'Regulatory updates', 'Risk assessment', 'Audit trails'],
      lastUpdate: '2024-11-30',
      compatibility: ['REST API', 'Webhook'],
      documentation: 'https://docs.complianceai.com/kmp',
      support: 'Premium support'
    }
  ];

  const apiEndpoints: APIEndpoint[] = [
    {
      id: '1',
      name: 'Get Product Events',
      method: 'GET',
      endpoint: '/api/v1/products/{id}/events',
      description: 'Retrieve all supply chain events for a specific product',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Product ID' },
        { name: 'limit', type: 'number', required: false, description: 'Number of events to return' },
        { name: 'offset', type: 'number', required: false, description: 'Pagination offset' }
      ],
      response: 'Array of event objects with blockchain proof',
      rateLimit: '1000 requests/hour',
      authentication: 'API Key required'
    },
    {
      id: '2',
      name: 'Create Supply Chain Event',
      method: 'POST',
      endpoint: '/api/v1/events',
      description: 'Create a new supply chain event with blockchain commitment',
      parameters: [
        { name: 'productId', type: 'string', required: true, description: 'Product identifier' },
        { name: 'eventType', type: 'string', required: true, description: 'Event type (harvest, process, ship, etc.)' },
        { name: 'location', type: 'string', required: true, description: 'Event location' },
        { name: 'metadata', type: 'object', required: false, description: 'Additional event data' }
      ],
      response: 'Event object with blockchain transaction ID',
      rateLimit: '500 requests/hour',
      authentication: 'API Key required'
    },
    {
      id: '3',
      name: 'Verify Product Authenticity',
      method: 'GET',
      endpoint: '/api/v1/products/{id}/verify',
      description: 'Verify product authenticity using blockchain proof',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Product ID' },
        { name: 'transactionId', type: 'string', required: false, description: 'Specific transaction to verify' }
      ],
      response: 'Verification result with proof details',
      rateLimit: '2000 requests/hour',
      authentication: 'API Key required'
    },
    {
      id: '4',
      name: 'Get Company Analytics',
      method: 'GET',
      endpoint: '/api/v1/companies/{id}/analytics',
      description: 'Retrieve comprehensive analytics for a company',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Company ID' },
        { name: 'timeframe', type: 'string', required: false, description: 'Time period (7d, 30d, 90d)' },
        { name: 'metrics', type: 'array', required: false, description: 'Specific metrics to include' }
      ],
      response: 'Analytics data with charts and metrics',
      rateLimit: '100 requests/hour',
      authentication: 'API Key required'
    }
  ];

  const usage: Usage[] = [
    {
      integrationId: '1',
      requests: 1250,
      successRate: 99.2,
      avgResponseTime: 240,
      errors: 10,
      lastUsed: '2025-01-17T10:30:00Z'
    },
    {
      integrationId: '2',
      requests: 2100,
      successRate: 98.8,
      avgResponseTime: 180,
      errors: 25,
      lastUsed: '2025-01-17T11:15:00Z'
    },
    {
      integrationId: '3',
      requests: 1800,
      successRate: 99.5,
      avgResponseTime: 320,
      errors: 9,
      lastUsed: '2025-01-17T09:45:00Z'
    },
    {
      integrationId: '5',
      requests: 3200,
      successRate: 99.8,
      avgResponseTime: 150,
      errors: 6,
      lastUsed: '2025-01-17T11:30:00Z'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'erp': return <Package className="h-4 w-4" />;
      case 'logistics': return <Zap className="h-4 w-4" />;
      case 'crm': return <Star className="h-4 w-4" />;
      case 'analytics': return <Code className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      case 'payments': return <Download className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive': return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'error': return <Badge className="bg-red-500">Error</Badge>;
      default: return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(int => int.category === selectedCategory);

  const activeIntegrations = integrations.filter(int => int.status === 'active');
  const totalRequests = usage.reduce((sum, u) => sum + u.requests, 0);
  const avgSuccessRate = usage.reduce((sum, u) => sum + u.successRate, 0) / usage.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Marketplace</h2>
          <p className="text-muted-foreground">
            Third-party integrations for ERP, logistics, and business systems
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>API Keys</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">
              Out of {integrations.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all integrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeIntegrations.reduce((sum, int) => sum + (int.pricing.type === 'paid' ? int.pricing.price : 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Integration subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="api">API Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'erp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('erp')}
            >
              ERP
            </Button>
            <Button
              variant={selectedCategory === 'logistics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('logistics')}
            >
              Logistics
            </Button>
            <Button
              variant={selectedCategory === 'crm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('crm')}
            >
              CRM
            </Button>
            <Button
              variant={selectedCategory === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('analytics')}
            >
              Analytics
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(integration.category)}
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(integration.status)}
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{integration.rating}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Provider:</span> {integration.provider}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Version:</span> {integration.version}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Downloads:</span> {integration.downloads.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Pricing:</span> {
                          integration.pricing.type === 'free' ? 'Free' :
                          integration.pricing.type === 'freemium' ? 'Freemium' :
                          `$${integration.pricing.price}/${integration.pricing.period}`
                        }
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Updated:</span> {new Date(integration.lastUpdate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        disabled={integration.status === 'active'}
                        onClick={() => alert(`Installing ${integration.name}...`)}
                      >
                        {integration.status === 'active' ? 'Installed' : 'Install'}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={integration.documentation} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Docs
                        </a>
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {integration.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4">
            {usage.map((usageData) => {
              const integration = integrations.find(int => int.id === usageData.integrationId);
              if (!integration) return null;

              return (
                <Card key={usageData.integrationId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(integration.category)}
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Last used: {new Date(usageData.lastUsed).toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageData.requests.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{usageData.successRate}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageData.avgResponseTime}ms</div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{usageData.errors}</div>
                        <div className="text-xs text-muted-foreground">Errors</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{usageData.successRate}%</span>
                      </div>
                      <Progress value={usageData.successRate} className="h-2" />
                    </div>

                    {usageData.errors > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {usageData.errors} errors detected. Review API logs for details.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4">
            {apiEndpoints.map((endpoint) => (
              <Card key={endpoint.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                        {endpoint.method}
                      </Badge>
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {endpoint.rateLimit}
                    </Badge>
                  </div>
                  <code className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                    {endpoint.endpoint}
                  </code>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{endpoint.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Parameters:</div>
                      {endpoint.parameters.map((param, idx) => (
                        <div key={idx} className="text-sm">
                          <code className="bg-gray-100 px-1 rounded">{param.name}</code>
                          <span className="text-muted-foreground"> ({param.type})</span>
                          {param.required && <span className="text-red-500"> *</span>}
                          <div className="text-xs text-muted-foreground ml-2">{param.description}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Response:</div>
                      <div className="text-sm text-muted-foreground">{endpoint.response}</div>
                      <div className="text-sm font-medium">Authentication:</div>
                      <div className="text-sm text-muted-foreground">{endpoint.authentication}</div>
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