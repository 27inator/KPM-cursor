import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  CreditCard, 
  Building, 
  Box, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";

interface WalletMetrics {
  masterWalletBalance: number;
  totalFeesSpent: number;
  totalFeesSpentUsd: number;
  activeCompanies: number;
  eventsToday: number;
}

export default function FinancialMetrics() {
  const { data: metrics, isLoading } = useQuery<WalletMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <p>Failed to load metrics</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Master Wallet Balance */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Master Wallet Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.masterWalletBalance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">KAS</p>
          </div>
          <div className="w-12 h-12 bg-kaspa-100 rounded-lg flex items-center justify-center">
            <Wallet className="text-kaspa-600 text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp className="text-green-500 text-xs mr-1" />
          <span className="text-sm text-green-600">+2.4%</span>
          <span className="text-sm text-gray-500 ml-1">vs last month</span>
        </div>
      </Card>

      {/* Total Fees Spent */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Fees Spent</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.totalFeesSpent.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              KAS (~${metrics.totalFeesSpentUsd.toFixed(2)})
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-red-600 text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp className="text-red-500 text-xs mr-1" />
          <span className="text-sm text-red-600">+8.2%</span>
          <span className="text-sm text-gray-500 ml-1">vs last month</span>
        </div>
      </Card>

      {/* Active Companies */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Companies</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.activeCompanies}
            </p>
            <p className="text-sm text-gray-500">Total wallets</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp className="text-green-500 text-xs mr-1" />
          <span className="text-sm text-green-600">+2</span>
          <span className="text-sm text-gray-500 ml-1">new this month</span>
        </div>
      </Card>

      {/* Events Today */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Events Today</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.eventsToday.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Blockchain commits</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Box className="text-green-600 text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <TrendingUp className="text-green-500 text-xs mr-1" />
          <span className="text-sm text-green-600">+12.5%</span>
          <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
        </div>
      </Card>
    </div>
  );
}
