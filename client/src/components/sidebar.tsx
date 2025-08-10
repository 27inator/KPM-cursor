import { useState } from "react";
import { 
  ChartLine, 
  Wallet, 
  Building, 
  Settings, 
  Shield, 
  Edit, 
  Box,
  BarChart3,
  Activity,
  Package,
  Search,
  Plus,
  Route,
  AlertTriangle,
  Server,
  Lock,
  Database,
  TrendingUp,
  Leaf,
  FileCheck,
  MapPin,
  Code,
  Users
} from "lucide-react";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const navigation = [
  { name: "Overview", id: "overview", icon: BarChart3 },
  { name: "Wallet Actions", id: "wallet-actions", icon: Wallet },
  { name: "Supply Chain", id: "supply-chain", icon: Package },
  { name: "Trail Tracker", id: "trail-tracker", icon: Route },
  { name: "Create Event", id: "create-event", icon: Plus },
  { name: "Companies", id: "companies", icon: Building },
  { name: "Hierarchical Supply Chain", id: "hierarchical-supply-chain", icon: TrendingUp },
  { name: "Provenance Tracking", id: "provenance-tracking", icon: Route },
  { name: "Blockchain Verification", id: "blockchain-verification", icon: Shield },
  { name: "Consumer Transparency", id: "consumer-transparency", icon: Users },
  { name: "Supply Chain Collaboration", id: "collaboration", icon: Building },
  { name: "Policy Management", id: "policy-management", icon: Shield },
  { name: "Advanced Analytics", id: "advanced-analytics", icon: ChartLine },
  { name: "Activity", id: "activity", icon: Activity },
  { name: "Connection", id: "connection", icon: Settings },
  { name: "Error Monitor", id: "errors", icon: AlertTriangle },
  { name: "Performance", id: "performance", icon: Server },
  { name: "Security", id: "security", icon: Lock },
  { name: "Database Security", id: "database-security", icon: Database },
];

export default function Sidebar({ activeTab = "overview", onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-kaspa-500 rounded-lg flex items-center justify-center">
            <Box className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">KPM Admin</h1>
            <p className="text-sm text-gray-500">Kaspa Provenance</p>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="px-6 py-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">Kaspa Testnet Live</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Connected to Kaspa testnet via WASM SDK
        </p>
      </div>
      
      <nav className="mt-6 flex-1 overflow-y-auto pb-20">
        <div className="px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.name}
                  onClick={() => onTabChange?.(item.id)}
                  className={`${
                    isActive
                      ? "bg-kaspa-50 text-kaspa-700"
                      : "text-gray-700 hover:bg-gray-50"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
                >
                  <Icon
                    className={`${
                      isActive ? "text-kaspa-500" : "text-gray-400"
                    } mr-3 h-5 w-5`}
                  />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Additional Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Blockchain Status</p>
          <p>SDK: Mock Implementation</p>
          <p>Network: Development Mode</p>
        </div>
      </div>
    </div>
  );
}
