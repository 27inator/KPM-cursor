import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, FileText, Download, Calendar, Shield, Zap } from 'lucide-react';

interface ComplianceRequirement {
  id: string;
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'pending' | 'needs-attention';
  deadline: string;
  criticality: 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  actions: string[];
}

interface RegulatoryReport {
  id: string;
  name: string;
  regulation: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  lastGenerated: string;
  nextDue: string;
  status: 'current' | 'overdue' | 'upcoming';
  completionRate: number;
  sections: {
    name: string;
    status: 'complete' | 'incomplete' | 'pending';
    dataPoints: number;
  }[];
}

interface AuditTrail {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  regulation: string;
  changes: string;
  impact: 'high' | 'medium' | 'low';
}

export default function AutomatedCompliance() {
  const [activeTab, setActiveTab] = useState('requirements');
  const [selectedRegulation, setSelectedRegulation] = useState('all');

  const complianceRequirements: ComplianceRequirement[] = [
    {
      id: '1',
      regulation: 'FDA Food Safety Modernization Act (FSMA)',
      requirement: 'Preventive Controls for Human Food',
      status: 'compliant',
      deadline: '2025-02-15',
      criticality: 'high',
      description: 'Implement and maintain a food safety plan with preventive controls',
      evidence: ['Food Safety Plan Document', 'Hazard Analysis Records', 'Training Records'],
      actions: ['Annual plan review scheduled', 'Staff training updated']
    },
    {
      id: '2',
      regulation: 'USDA Organic Regulations',
      requirement: 'Organic System Plan',
      status: 'compliant',
      deadline: '2025-03-01',
      criticality: 'high',
      description: 'Maintain organic certification and system plan',
      evidence: ['Organic Certificate', 'System Plan', 'Inspector Reports'],
      actions: ['Certificate renewal in progress', 'System plan updated']
    },
    {
      id: '3',
      regulation: 'EU General Data Protection Regulation (GDPR)',
      requirement: 'Data Processing Records',
      status: 'needs-attention',
      deadline: '2025-01-30',
      criticality: 'medium',
      description: 'Maintain records of processing activities',
      evidence: ['Privacy Policy', 'Data Mapping'],
      actions: ['Update privacy policy', 'Complete data mapping audit']
    },
    {
      id: '4',
      regulation: 'ISO 22000 Food Safety Management',
      requirement: 'Management Review',
      status: 'pending',
      deadline: '2025-02-28',
      criticality: 'medium',
      description: 'Conduct annual management review of food safety management system',
      evidence: ['Previous review minutes', 'Performance data'],
      actions: ['Schedule management review meeting', 'Prepare performance reports']
    },
    {
      id: '5',
      regulation: 'Fair Labor Standards Act (FLSA)',
      requirement: 'Wage and Hour Records',
      status: 'non-compliant',
      deadline: '2025-01-20',
      criticality: 'high',
      description: 'Maintain accurate wage and hour records for all employees',
      evidence: ['Time tracking system', 'Payroll records'],
      actions: ['Implement automated time tracking', 'Audit payroll records']
    }
  ];

  const regulatoryReports: RegulatoryReport[] = [
    {
      id: '1',
      name: 'FDA Food Facility Registration',
      regulation: 'FDA FSMA',
      frequency: 'annually',
      lastGenerated: '2024-12-15',
      nextDue: '2025-12-15',
      status: 'current',
      completionRate: 100,
      sections: [
        { name: 'Facility Information', status: 'complete', dataPoints: 25 },
        { name: 'Process Categories', status: 'complete', dataPoints: 12 },
        { name: 'Product Categories', status: 'complete', dataPoints: 8 }
      ]
    },
    {
      id: '2',
      name: 'Organic Certification Report',
      regulation: 'USDA Organic',
      frequency: 'annually',
      lastGenerated: '2024-11-20',
      nextDue: '2025-11-20',
      status: 'current',
      completionRate: 95,
      sections: [
        { name: 'Production Practices', status: 'complete', dataPoints: 18 },
        { name: 'Input Materials', status: 'complete', dataPoints: 15 },
        { name: 'Record Keeping', status: 'incomplete', dataPoints: 7 }
      ]
    },
    {
      id: '3',
      name: 'GDPR Data Protection Impact Assessment',
      regulation: 'EU GDPR',
      frequency: 'quarterly',
      lastGenerated: '2024-12-01',
      nextDue: '2025-03-01',
      status: 'upcoming',
      completionRate: 65,
      sections: [
        { name: 'Data Processing Activities', status: 'complete', dataPoints: 22 },
        { name: 'Risk Assessment', status: 'incomplete', dataPoints: 8 },
        { name: 'Mitigation Measures', status: 'pending', dataPoints: 0 }
      ]
    },
    {
      id: '4',
      name: 'Environmental Impact Report',
      regulation: 'EPA Clean Air Act',
      frequency: 'quarterly',
      lastGenerated: '2024-10-15',
      nextDue: '2025-01-15',
      status: 'overdue',
      completionRate: 30,
      sections: [
        { name: 'Emissions Data', status: 'incomplete', dataPoints: 5 },
        { name: 'Monitoring Results', status: 'pending', dataPoints: 0 },
        { name: 'Corrective Actions', status: 'pending', dataPoints: 0 }
      ]
    }
  ];

  const auditTrail: AuditTrail[] = [
    {
      id: '1',
      timestamp: '2025-01-17T10:30:00Z',
      action: 'Updated Food Safety Plan',
      user: 'Sarah Johnson',
      regulation: 'FDA FSMA',
      changes: 'Added new allergen control procedure',
      impact: 'medium'
    },
    {
      id: '2',
      timestamp: '2025-01-17T09:15:00Z',
      action: 'Generated Compliance Report',
      user: 'System Auto',
      regulation: 'USDA Organic',
      changes: 'Automated quarterly report generation',
      impact: 'low'
    },
    {
      id: '3',
      timestamp: '2025-01-16T16:45:00Z',
      action: 'Privacy Policy Updated',
      user: 'Michael Chen',
      regulation: 'EU GDPR',
      changes: 'Updated data retention periods',
      impact: 'high'
    },
    {
      id: '4',
      timestamp: '2025-01-16T14:20:00Z',
      action: 'Wage Records Audit',
      user: 'Lisa Rodriguez',
      regulation: 'FLSA',
      changes: 'Identified missing overtime calculations',
      impact: 'high'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'current':
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non-compliant':
      case 'overdue':
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs-attention':
      case 'upcoming':
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'current':
        return 'bg-green-500';
      case 'non-compliant':
      case 'overdue':
        return 'bg-red-500';
      case 'needs-attention':
      case 'upcoming':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const generateReport = (reportId: string) => {
    const report = regulatoryReports.find(r => r.id === reportId);
    if (report) {
      alert(`Generating ${report.name}. Report will be available for download in 2-3 minutes.`);
    }
  };

  const calculateOverallCompliance = () => {
    const compliantCount = complianceRequirements.filter(req => req.status === 'compliant').length;
    return Math.round((compliantCount / complianceRequirements.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automated Compliance</h2>
          <p className="text-muted-foreground">
            One-click regulatory reports and compliance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Compliance Dashboard</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateOverallCompliance()}%</div>
            <p className="text-xs text-muted-foreground">
              {complianceRequirements.filter(req => req.status === 'compliant').length} of {complianceRequirements.length} requirements met
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complianceRequirements.filter(req => req.status === 'non-compliant' && req.criticality === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {complianceRequirements.filter(req => {
                const deadline = new Date(req.deadline);
                const now = new Date();
                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 30 && daysUntil > 0;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">
              Reports generated automatically
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid gap-4">
            {complianceRequirements.map((requirement) => (
              <Card key={requirement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(requirement.status)}
                      <CardTitle className="text-lg">{requirement.requirement}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getCriticalityColor(requirement.criticality)}>
                        {requirement.criticality.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Due: {new Date(requirement.deadline).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{requirement.regulation}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{requirement.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Evidence:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {requirement.evidence.map((evidence, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <FileText className="h-3 w-3 mt-0.5 text-blue-500" />
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Actions:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {requirement.actions.map((action, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Zap className="h-3 w-3 mt-0.5 text-green-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(requirement.status)}`} />
                    <span className="text-sm font-medium capitalize">{requirement.status.replace('-', ' ')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {regulatoryReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(report.status)}
                      <Badge variant="outline" className="text-xs">
                        {report.frequency}
                      </Badge>
                      <Button size="sm" onClick={() => generateReport(report.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.regulation}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Last Generated:</span> {new Date(report.lastGenerated).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Next Due:</span> {new Date(report.nextDue).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{report.completionRate}%</span>
                      </div>
                      <Progress value={report.completionRate} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Report Sections:</div>
                    {report.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(section.status)}
                          <span className="text-sm">{section.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {section.dataPoints} data points
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid gap-4">
            {auditTrail.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-muted-foreground">
                        {new Date(audit.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm font-medium">{audit.action}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {audit.user}
                      </Badge>
                      <Badge variant={audit.impact === 'high' ? 'destructive' : audit.impact === 'medium' ? 'default' : 'secondary'}>
                        {audit.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-muted-foreground">Regulation: {audit.regulation}</div>
                    <div className="text-sm">{audit.changes}</div>
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