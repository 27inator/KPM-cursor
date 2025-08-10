import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  Leaf, 
  AlertTriangle, 
  Eye, 
  PlusCircle, 
  Ban, 
  Search, 
  Plus,
  CheckCircle,
  PauseCircle,
  BarChart3
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import CompanyAnalytics from "./company-analytics";

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

export default function CompanyWalletTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/dashboard/companies"],
  });

  const filteredCompanies = companies?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.companyId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Building className="text-blue-600" />;
      case "low_balance":
        return <AlertTriangle className="text-yellow-600" />;
      default:
        return <Building className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, autoFundEnabled: boolean) => {
    if (status === "low_balance") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
          Low Balance
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
        Active
      </Badge>
    );
  };

  const getAutoFundBadge = (autoFundEnabled: boolean) => {
    if (autoFundEnabled) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Enabled
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <PauseCircle className="w-3 h-3 mr-1" />
        Paused
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48 mt-1" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Company Wallet Management</h3>
            <p className="text-sm text-gray-500">Monitor and manage company-specific wallet balances</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-48"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="low_balance">Low balance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-kaspa-500 hover:bg-kaspa-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto-Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getStatusIcon(company.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.companyId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{company.walletAddress}</div>
                    <div className="text-sm text-gray-500">HD Path: m/44'/277'/{company.hdPathIndex}'/0/0</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${company.status === 'low_balance' ? 'text-red-600' : 'text-gray-900'}`}>
                      {company.balance.toFixed(2)} KAS
                    </div>
                    <div className="text-sm text-gray-500">
                      ~${(company.balance * 0.75).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAutoFundBadge(company.autoFundEnabled)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(company.status, company.autoFundEnabled)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-900">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Company Analytics</DialogTitle>
                            <DialogDescription>
                              Detailed analytics and transaction history for {company.name}
                            </DialogDescription>
                          </DialogHeader>
                          <CompanyAnalytics 
                            companyId={company.companyId} 
                            companyName={company.name} 
                          />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" className="text-kaspa-600 hover:text-kaspa-900">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 mt-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredCompanies.length}</span> of{" "}
              <span className="font-medium">{companies?.length || 0}</span> companies
            </div>
            <nav className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" className="bg-kaspa-500 text-white">
                1
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </nav>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
