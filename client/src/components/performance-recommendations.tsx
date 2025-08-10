import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  Shield,
  Clock,
  Cpu,
  Database
} from 'lucide-react';

interface Recommendation {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  summary: {
    totalMetrics: number;
    healthScore: number;
    lastUpdated: string;
  };
}

export default function PerformanceRecommendations() {
  const { data: recommendations, isLoading } = useQuery<RecommendationResponse>({
    queryKey: ['/api/system/metrics/recommendations'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-2"></div>
          <div className="h-20 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Performance Recommendations</h2>
        {recommendations && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Health Score:</span>
            <span className={`text-lg font-bold ${getHealthScoreColor(recommendations.summary.healthScore)}`}>
              {recommendations.summary.healthScore}%
            </span>
          </div>
        )}
      </div>

      {recommendations && recommendations.recommendations.length === 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All systems are running optimally. No recommendations at this time.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {recommendations?.recommendations.map((rec, index) => (
          <Alert key={index} className={getRecommendationColor(rec.type)}>
            <div className="flex items-start gap-3">
              {getRecommendationIcon(rec.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{rec.title}</h3>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>
                <AlertDescription>{rec.message}</AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </div>

      {/* Detailed Memory Usage Alert Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Memory Usage Alert (80% Threshold) - Explained
          </CardTitle>
          <CardDescription>
            Understanding why memory monitoring is critical for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why 80% Memory Usage Matters:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Performance Impact</strong>: High memory usage slows down your application</li>
                <li>• <strong>Crash Prevention</strong>: Prevents out-of-memory errors that crash the server</li>
                <li>• <strong>Resource Planning</strong>: Helps identify when you need more server resources</li>
                <li>• <strong>Memory Leaks</strong>: Detects potential memory leaks in your application code</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">What to do when memory exceeds 80%:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Restart the server to clear memory</li>
                <li>• Optimize database queries and reduce data loading</li>
                <li>• Check for memory leaks in your code</li>
                <li>• Consider increasing server memory resources</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Optimization Tips
          </CardTitle>
          <CardDescription>
            Specific recommendations for optimal system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">CPU Optimization</h4>
                <p className="text-sm text-gray-600">
                  Monitor CPU usage patterns during peak times. Consider load balancing for high-traffic periods.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Database Performance</h4>
                <p className="text-sm text-gray-600">
                  Implement query optimization, connection pooling, and consider indexing frequently queried fields.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Security & Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Regular security audits, rate limiting, and continuous monitoring maintain optimal performance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Response Time (1000ms threshold)</h4>
                <p className="text-sm text-gray-600">
                  Users expect responses under 500ms. Implement caching, optimize API endpoints, and profile slow queries.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {recommendations && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(recommendations.summary.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}