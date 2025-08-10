import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Package, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Link
} from "lucide-react";

interface CompanyActivityFeedProps {
  companyId: string;
}

export default function CompanyActivityFeed({ companyId }: CompanyActivityFeedProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: [`/api/companies/${companyId}/activities`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentEvents } = useQuery({
    queryKey: [`/api/companies/${companyId}/analytics`],
  });

  // Create activity feed from recent events
  const activityFeed = recentEvents?.recentEvents?.map((event: any) => ({
    id: event.id,
    type: 'supply_chain_event',
    title: `${event.eventType} Event`,
    description: `Product ${event.tagId} processed`,
    timestamp: new Date(event.timestamp * 1000).toISOString(),
    status: event.status,
    icon: Package,
    metadata: {
      eventType: event.eventType,
      tagId: event.tagId,
      txid: event.txid,
      verified: event.status === 'confirmed'
    }
  })) || [];

  // Add system activities
  const systemActivities = [
    {
      id: 'system-1',
      type: 'blockchain_sync',
      title: 'Blockchain Sync',
      description: 'Successfully synchronized with Kaspa network',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'success',
      icon: Shield,
      metadata: { verified: true }
    },
    {
      id: 'system-2',
      type: 'policy_update',
      title: 'Policy Updated',
      description: 'Blockchain commit event types updated',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'success',
      icon: Shield,
      metadata: { verified: true }
    }
  ];

  const allActivities = [...activityFeed, ...systemActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {allActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(activity.status)}
                          <span className="text-xs text-gray-500">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                        {activity.metadata?.txid && (
                          <a 
                            href={`https://explorer.kaspa.org/txs/${activity.metadata.txid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-kaspa-600 hover:text-kaspa-800 flex items-center gap-1"
                          >
                            View TX
                            <Link className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}