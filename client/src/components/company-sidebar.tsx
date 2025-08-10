import { useState } from "react";
import { 
  ChartLine, 
  Building, 
  Settings, 
  Shield, 
  Box,
  BarChart3,
  Activity,
  Package,
  Route,
  AlertTriangle,
  Server,
  Lock,
  Database,
  TrendingUp,
  FileCheck,
  Users,
  Home,
  LogOut
} from "lucide-react";

interface CompanySidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  companyName?: string;
  companyId?: string;
  onLogout?: () => void;
}

const navigation = [
  { name: "Overview", id: "overview", icon: BarChart3 },
  { name: "Transactions", id: "transactions", icon: Package },
  { name: "Analytics", id: "analytics", icon: ChartLine },
  { name: "Advanced", id: "advanced-analytics", icon: TrendingUp },
  { name: "Product Analytics", id: "hierarchical", icon: Route },
  { name: "Enhanced", id: "enhanced", icon: Activity },
  { name: "Policy", id: "policy", icon: Shield },
  { name: "Consumer", id: "consumer", icon: Users },
];

const systemNavigation = [
  { name: "Activity Feed", id: "activity", icon: Activity },
  { name: "System Status", id: "connection", icon: Settings },
  { name: "Security", id: "security", icon: Lock },
  { name: "Performance", id: "performance", icon: Server },
];

export default function CompanySidebar({ 
  activeTab = "overview", 
  onTabChange, 
  companyName = "Company",
  companyId = "",
  onLogout
}: CompanySidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-kaspa-500 rounded-lg flex items-center justify-center">
            <Building className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{companyName}</h1>
            <p className="text-sm text-gray-500 font-mono">{companyId}</p>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="px-6 py-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">Connected</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Blockchain sync active
        </p>
      </div>
      
      <nav className="mt-6 flex-1 overflow-y-auto pb-20">
        <div className="px-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Dashboard
            </div>
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

          {/* System Navigation */}
          <div className="mt-6 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              System
            </div>
            {systemNavigation.map((item) => {
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

      {/* Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}