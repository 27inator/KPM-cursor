import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Truck, 
  ClipboardCheck, 
  ExternalLink 
} from "lucide-react";

interface Event {
  id: number;
  eventId: string;
  eventType: string;
  tagId: string;
  txid: string;
  fee: number;
  ts: number;
  companyName: string;
}

export default function RecentActivity() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/dashboard/recent-events"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-events?limit=10");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "FARM":
        return <CheckCircle className="text-green-600 text-sm" />;
      case "SHIP":
        return <Truck className="text-blue-600 text-sm" />;
      case "QC":
        return <ClipboardCheck className="text-purple-600 text-sm" />;
      default:
        return <CheckCircle className="text-gray-600 text-sm" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "FARM":
        return "bg-green-100 text-green-800";
      case "SHIP":
        return "bg-blue-100 text-blue-800";
      case "QC":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Blockchain Activity</h3>
          <p className="text-sm text-gray-500">Latest provenance events committed to Kaspa blockchain</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="divide-y divide-gray-200">
          {events?.map((event) => (
            <div key={event.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    {getEventIcon(event.eventType)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <Badge variant="secondary" className={getEventBadgeColor(event.eventType)}>
                        {event.eventType}
                      </Badge>
                      {" "}event committed for{" "}
                      <span className="font-mono text-kaspa-600">{event.tagId}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Company: <span className="font-medium">{event.companyName}</span> • 
                      Fee: <span className="font-medium">{event.fee} KAS</span> • 
                      <span className="font-medium">{formatTimeAgo(event.ts)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-kaspa-600 hover:text-kaspa-800">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View TX
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 mt-4 rounded-b-lg">
          <Button variant="ghost" className="w-full text-center text-sm text-kaspa-600 hover:text-kaspa-800 font-medium">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
