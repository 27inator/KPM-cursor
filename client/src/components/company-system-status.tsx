import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Shield, 
  Database, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  Zap
} from "lucide-react";

interface CompanySystemStatusProps {
  companyId: string;
}

export default function CompanySystemStatus({ companyId }: CompanySystemStatusProps) {
  const { data: systemStatus } = useQuery({
    queryKey: [`/api/companies/${companyId}/system-status`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: [`/api/companies/${companyId}/analytics`],
  });

  // Mock system status data - in production this would come from the API
  const mockSystemStatus = {
    blockchain: {
      status: 'connected',
      lastBlock: 12345678,
      confirmations: 6,
      networkHealth: 98
    },
    api: {
      status: 'operational',
      responseTime: 145,
      uptime: 99.9
    },
    database: {
      status: 'healthy',
      connections: 8,
      performance: 95
    },
    events: {
      totalProcessed: analytics?.totalEvents || 0,
      successRate: analytics?.recentEvents ? 
        Math.round((analytics.recentEvents.filter((e: any) => e.status === 'confirmed').length / analytics.recentEvents.length) * 100) : 0,
      averageProcessingTime: 245
    }
  };

  const status = systemStatus || mockSystemStatus;

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'operational':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'connected':
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blockchain Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Blockchain</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.blockchain.status)}
                  <Badge variant="outline" className={getStatusColor(status.blockchain.status)}>
                    {status.blockchain.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Latest Block:</span>
                  <span className="font-mono">{status.blockchain.lastBlock.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmations:</span>
                  <span>{status.blockchain.confirmations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Health:</span>
                  <span>{status.blockchain.networkHealth}%</span>
                </div>
                <Progress value={status.blockchain.networkHealth} className="h-2" />
              </div>
            </div>

            {/* API Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">API Service</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.api.status)}
                  <Badge variant="outline" className={getStatusColor(status.api.status)}>
                    {status.api.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{status.api.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span>{status.api.uptime}%</span>
                </div>
                <Progress value={status.api.uptime} className="h-2" />
              </div>
            </div>

            {/* Database Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.database.status)}
                  <Badge variant="outline" className={getStatusColor(status.database.status)}>
                    {status.database.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Active Connections:</span>
                  <span>{status.database.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance:</span>
                  <span>{status.database.performance}%</span>
                </div>
                <Progress value={status.database.performance} className="h-2" />
              </div>
            </div>

            {/* Event Processing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Event Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    active
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Processed:</span>
                  <span>{status.events.totalProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span>{status.events.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Processing:</span>
                  <span>{status.events.averageProcessingTime}ms</span>
                </div>
                <Progress value={status.events.successRate} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}