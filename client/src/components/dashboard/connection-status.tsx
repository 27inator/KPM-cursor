import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const isMainnetConnected = false; // Currently using mock SDK
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isMainnetConnected ? <CheckCircle className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-orange-500" />}
            Kaspa Network Connection
          </CardTitle>
          <CardDescription>
            Current blockchain connection status and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Network Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isMainnetConnected ? "default" : "secondary"}>
                  {isMainnetConnected ? "Connected" : "Mock Mode"}
                </Badge>
                <span className="text-sm text-gray-500">
                  {isMainnetConnected ? "Kaspa Mainnet" : "Development Environment"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">SDK Version</p>
              <p className="text-sm text-gray-500 mt-1">kaspeak-sdk@0.1.0</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Connection Details</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Implementation:</span>
                <span className="text-gray-500">Mock Kaspa SDK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction Signing:</span>
                <span className="text-gray-500">Simulated</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Balance Updates:</span>
                <span className="text-gray-500">Mock Data</span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Development Mode:</strong> This application is currently using a mock implementation of the Kaspa SDK. 
              Transactions and balances shown are simulated for demonstration purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connecting to Kaspa Mainnet</CardTitle>
          <CardDescription>
            Steps to connect this application to the real Kaspa blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                1
              </div>
              <div>
                <h4 className="font-medium">Configure Kaspeak SDK</h4>
                <p className="text-sm text-gray-600">
                  Set up the Kaspeak SDK with proper initialization parameters for mainnet or testnet
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium">Set Master Seed Phrase</h4>
                <p className="text-sm text-gray-600">
                  Configure the MASTER_MNEMONIC environment variable with your HD wallet seed phrase
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                3
              </div>
              <div>
                <h4 className="font-medium">Update Network Settings</h4>
                <p className="text-sm text-gray-600">
                  Configure network endpoints and RPC settings for mainnet connectivity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                4
              </div>
              <div>
                <h4 className="font-medium">Replace Mock Implementation</h4>
                <p className="text-sm text-gray-600">
                  Update server/services/kaspa.ts to use the real Kaspeak SDK instead of mock functions
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Connecting to mainnet requires proper wallet security practices. 
              Ensure you have proper backup of seed phrases and test thoroughly on testnet first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}