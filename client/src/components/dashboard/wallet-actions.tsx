import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Plus, Settings, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Company {
  id: number;
  companyId: string;
  name: string;
  walletAddress: string;
  balance: number;
  autoFundEnabled: boolean;
  status: string;
  hdPathIndex: number;
}

interface WalletActionsProps {
  companies: Company[];
}

export default function WalletActions({ companies: propCompanies }: WalletActionsProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real company data from API
  const { data: companies = propCompanies } = useQuery({
    queryKey: ['/api/dashboard/companies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dashboard/companies');
      return response.json();
    },
    initialData: propCompanies
  });

  // Fetch real wallet metrics from API with refresh capability
  const { data: walletMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dashboard/metrics');
      return response.json();
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const fundWalletMutation = useMutation({
    mutationFn: async ({ companyId, amount }: { companyId: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/wallets/fund', { companyId, amount });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Wallet Funded",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/companies'] });
      setFundAmount("");
      setSelectedCompany(null);
    },
    onError: (error: any) => {
      toast({
        title: "Funding Failed",
        description: error.message || "Failed to fund wallet",
        variant: "destructive"
      });
    }
  });

  const toggleAutoFundMutation = useMutation({
    mutationFn: async ({ companyId, enabled }: { companyId: string; enabled: boolean }) => {
      const response = await apiRequest('POST', '/api/wallets/auto-fund', { companyId, enabled });
      return response.json();
    },
    onMutate: async ({ companyId, enabled }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/dashboard/companies'] });
      
      // Snapshot the previous value
      const previousCompanies = queryClient.getQueryData(['/api/dashboard/companies']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['/api/dashboard/companies'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((company: any) => 
          company.companyId === companyId 
            ? { ...company, autoFundEnabled: enabled }
            : company
        );
      });
      
      return { previousCompanies };
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-funding Updated",
        description: data.message,
      });
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/companies'] });
    },
    onError: (error: any, variables, context) => {
      // Roll back the optimistic update
      if (context?.previousCompanies) {
        queryClient.setQueryData(['/api/dashboard/companies'], context.previousCompanies);
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update auto-funding",
        variant: "destructive"
      });
    }
  });

  const refreshBalanceMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest('POST', `/api/companies/${companyId}/refresh-balance`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Balance Updated",
        description: `Balance updated: ${data.previousBalance} → ${data.newBalance} KAS`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/companies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh balance",
        variant: "destructive"
      });
    }
  });

  const handleFundWallet = () => {
    if (!selectedCompany || !fundAmount) return;
    
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    fundWalletMutation.mutate({ companyId: selectedCompany.companyId, amount });
  };

  const handleToggleAutoFund = (company: Company) => {
    toggleAutoFundMutation.mutate({ 
      companyId: company.companyId, 
      enabled: !company.autoFundEnabled 
    });
  };

  const handleRefreshBalance = (company: Company) => {
    refreshBalanceMutation.mutate(company.id);
  };

  return (
    <div className="space-y-6">
      {/* Fund Wallet Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Fund Company Wallet
          </CardTitle>
          <CardDescription>
            Transfer KAS from master wallet to company wallets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-select">Select Company</Label>
            <select
              id="company-select"
              className="w-full p-2 border rounded-md"
              value={selectedCompany?.id || ""}
              onChange={(e) => {
                const company = companies.find(c => c.id === parseInt(e.target.value));
                setSelectedCompany(company || null);
              }}
            >
              <option value="">Select a company...</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name} - {company.balance} KAS
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fund-amount">Amount (KAS)</Label>
            <Input
              id="fund-amount"
              type="number"
              placeholder="Enter amount to fund"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          
          <Button 
            onClick={handleFundWallet}
            disabled={!selectedCompany || !fundAmount || fundWalletMutation.isPending}
            className="w-full"
          >
            {fundWalletMutation.isPending ? "Funding..." : "Fund Wallet"}
          </Button>
        </CardContent>
      </Card>

      {/* Auto-funding Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-funding Controls
          </CardTitle>
          <CardDescription>
            Enable or disable automatic wallet funding for companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map(company => (
              <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.balance} KAS • {company.walletAddress}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={company.autoFundEnabled ? "default" : "secondary"}>
                    {company.autoFundEnabled ? "Auto-fund ON" : "Auto-fund OFF"}
                  </Badge>
                  
                  <Switch
                    checked={company.autoFundEnabled}
                    onCheckedChange={() => handleToggleAutoFund(company)}
                    disabled={toggleAutoFundMutation.isPending}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshBalance(company)}
                    disabled={refreshBalanceMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Master Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Master Wallet Status
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchMetrics()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{walletMetrics?.masterWalletBalance?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Master Balance (KAS)</p>
              <p className="text-xs text-orange-600 mt-1">
                API issue - check explorer manually
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{walletMetrics?.totalFeesSpent?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Total Fees Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${(((walletMetrics?.masterWalletBalance || 0) - (walletMetrics?.totalFeesSpent || 0)) * 0.05).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">USD Value (Testnet)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}