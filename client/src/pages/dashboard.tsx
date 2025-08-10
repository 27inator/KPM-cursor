import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logout } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import FinancialMetrics from "@/components/dashboard/financial-metrics";
import CompanyWalletTable from "@/components/dashboard/company-wallet-table";
import RecentActivity from "@/components/dashboard/recent-activity";
import WalletActions from "@/components/dashboard/wallet-actions";
import EventForm from "@/components/dashboard/event-form";
import ProvenanceTracker from "@/components/dashboard/provenance-tracker";
import ConnectionStatus from "@/components/dashboard/connection-status";
import SupplyChainTracking from "@/components/dashboard/supply-chain-tracking";
import DashboardAnalytics from "@/components/dashboard/dashboard-analytics";
import TrailTracker from "@/components/dashboard/trail-tracker";
import PolicyManagement from "@/components/policy-management";
import ErrorMonitoringDashboard from "@/components/error-monitoring-dashboard";
import SystemPerformanceDashboard from "@/components/system-performance-dashboard";
import SecurityComplianceDashboard from "@/components/security-compliance-dashboard";
import DatabaseSecurityDashboard from "@/components/database-security-dashboard";
import AdvancedAnalytics from "@/components/analytics/advanced-analytics";
import NotificationCenter from "@/components/notifications/notification-center";
import ToastNotifications from "@/components/notifications/toast-notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { LogOut, Activity, Wallet, Package, Search, Plus, BarChart3, Building, Home, Shield, Server, Database, TrendingUp, Leaf, FileCheck, MapPin, Code } from "lucide-react";
import ProvenanceTracking from "@/components/provenance-tracking";
import BlockchainVerification from "@/components/blockchain-verification";
import ConsumerTransparency from "@/components/consumer-transparency";
import SupplyChainCollaboration from "@/components/supply-chain-collaboration";
import HierarchicalSupplyChain from "@/components/hierarchical-supply-chain";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  // Sample data - in production this would come from API
  const sampleCompanies = [
    {
      id: 1,
      companyId: "comp_1234567890",
      name: "FreshCorp Industries",
      walletAddress: "kaspa:qz8x...3k2m",
      balance: 127.45,
      autoFundEnabled: true,
      status: "active",
      hdPathIndex: 0,
      commitEventTypes: ["FARM", "SHIP", "QC"]
    },
    {
      id: 2,
      companyId: "comp_0987654321",
      name: "GreenFarms LLC",
      walletAddress: "kaspa:qy7w...8n3p",
      balance: 89.12,
      autoFundEnabled: true,
      status: "active",
      hdPathIndex: 1,
      commitEventTypes: ["FARM", "SHIP", "QC"]
    },
    {
      id: 3,
      companyId: "comp_5678901234",
      name: "TechLogistics Co.",
      walletAddress: "kaspa:qr5t...7h9k",
      balance: 12.34,
      autoFundEnabled: false,
      status: "low_balance",
      hdPathIndex: 2,
      commitEventTypes: ["SHIP", "QC"]
    }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kaspa Provenance Model</h2>
              <p className="text-sm text-gray-500">Blockchain-anchored supply chain management</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    System Analytics
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>KMP System Analytics</DialogTitle>
                    <DialogDescription>
                      Comprehensive analytics for the entire Kaspa Provenance Model system
                    </DialogDescription>
                  </DialogHeader>
                  <DashboardAnalytics />
                </DialogContent>
              </Dialog>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Development Mode</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/company-login')}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                Company Login
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2"
                title="Go to Admin Home"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32" 
                  alt="Admin avatar" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">Admin</span>
                <NotificationCenter />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <FinancialMetrics />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompanyWalletTable />
                <RecentActivity />
              </div>
            </div>
          )}

          {activeTab === "wallet-actions" && (
            <div className="space-y-6">
              <WalletActions companies={sampleCompanies} />
            </div>
          )}

          {activeTab === "supply-chain" && (
            <div className="space-y-6">
              <SupplyChainTracking />
            </div>
          )}

          {activeTab === "create-event" && (
            <div className="space-y-6">
              <EventForm companies={sampleCompanies} />
            </div>
          )}

          {activeTab === "companies" && (
            <div className="space-y-6">
              <CompanyWalletTable />
            </div>
          )}

          {activeTab === "policy-management" && (
            <div className="space-y-6">
              <PolicyManagement />
            </div>
          )}

          {activeTab === "advanced-analytics" && (
            <div className="space-y-6">
              <AdvancedAnalytics />
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <RecentActivity />
            </div>
          )}

          {activeTab === "connection" && (
            <div className="space-y-6">
              <ConnectionStatus />
            </div>
          )}

          {activeTab === "trail-tracker" && (
            <div className="space-y-6">
              <TrailTracker />
            </div>
          )}

          {activeTab === "errors" && (
            <div className="space-y-6">
              <ErrorMonitoringDashboard />
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              <SystemPerformanceDashboard />
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <SecurityComplianceDashboard />
            </div>
          )}

          {activeTab === "database-security" && (
            <div className="space-y-6">
              <DatabaseSecurityDashboard />
            </div>
          )}

          {activeTab === "hierarchical-supply-chain" && (
            <div className="space-y-6">
              <HierarchicalSupplyChain />
            </div>
          )}



          {activeTab === "provenance-tracking" && (
            <div className="space-y-6">
              <ProvenanceTracking />
            </div>
          )}

          {activeTab === "blockchain-verification" && (
            <div className="space-y-6">
              <BlockchainVerification />
            </div>
          )}

          {activeTab === "consumer-transparency" && (
            <div className="space-y-6">
              <ConsumerTransparency />
            </div>
          )}

          {activeTab === "collaboration" && (
            <div className="space-y-6">
              <SupplyChainCollaboration />
            </div>
          )}
        </main>
      </div>
      
      {/* Real-time notifications */}
      <ToastNotifications />
    </div>
  );
}