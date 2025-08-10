import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, ArrowLeftRight, Network, Zap, CheckCircle, AlertTriangle, Globe, Settings } from 'lucide-react';

interface CrossChainBridge {
  id: string;
  name: string;
  sourceChain: string;
  targetChain: string;
  protocol: string;
  status: 'active' | 'maintenance' | 'inactive';
  tvl: number;
  fee: number;
  processingTime: number;
  securityLevel: 'high' | 'medium' | 'low';
  supportedAssets: string[];
  dailyVolume: number;
}

interface CrossChainTransaction {
  id: string;
  bridgeId: string;
  fromChain: string;
  toChain: string;
  asset: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'confirming';
  timestamp: string;
  txHashFrom: string;
  txHashTo: string;
  fee: number;
  confirmations: number;
  requiredConfirmations: number;
}

interface ChainMetrics {
  chainId: string;
  name: string;
  symbol: string;
  logo: string;
  blockHeight: number;
  blockTime: number;
  gasPrice: number;
  status: 'online' | 'offline' | 'syncing';
  provenanceRecords: number;
  lastSync: string;
}

export default function CrossChainInteroperability() {
  const [activeTab, setActiveTab] = useState('bridges');
  const [selectedBridge, setSelectedBridge] = useState<string | null>(null);

  const bridges: CrossChainBridge[] = [
    {
      id: '1',
      name: 'Kaspa-Ethereum Bridge',
      sourceChain: 'Kaspa',
      targetChain: 'Ethereum',
      protocol: 'Lock & Mint',
      status: 'active',
      tvl: 2500000,
      fee: 0.001,
      processingTime: 15,
      securityLevel: 'high',
      supportedAssets: ['KAS', 'WKAS', 'PROVENANCE_NFT'],
      dailyVolume: 150000
    },
    {
      id: '2',
      name: 'Kaspa-Polygon Bridge',
      sourceChain: 'Kaspa',
      targetChain: 'Polygon',
      protocol: 'Atomic Swap',
      status: 'active',
      tvl: 850000,
      fee: 0.0005,
      processingTime: 8,
      securityLevel: 'high',
      supportedAssets: ['KAS', 'MATIC', 'PROVENANCE_TOKEN'],
      dailyVolume: 95000
    },
    {
      id: '3',
      name: 'Kaspa-BSC Bridge',
      sourceChain: 'Kaspa',
      targetChain: 'Binance Smart Chain',
      protocol: 'Validator Network',
      status: 'maintenance',
      tvl: 1200000,
      fee: 0.0008,
      processingTime: 12,
      securityLevel: 'medium',
      supportedAssets: ['KAS', 'BNB', 'SUPPLY_CHAIN_TOKEN'],
      dailyVolume: 75000
    },
    {
      id: '4',
      name: 'Kaspa-Solana Bridge',
      sourceChain: 'Kaspa',
      targetChain: 'Solana',
      protocol: 'Wormhole',
      status: 'active',
      tvl: 450000,
      fee: 0.0003,
      processingTime: 5,
      securityLevel: 'high',
      supportedAssets: ['KAS', 'SOL', 'PROVENANCE_SPL'],
      dailyVolume: 32000
    }
  ];

  const transactions: CrossChainTransaction[] = [
    {
      id: '1',
      bridgeId: '1',
      fromChain: 'Kaspa',
      toChain: 'Ethereum',
      asset: 'PROVENANCE_NFT',
      amount: 1,
      status: 'completed',
      timestamp: '2025-01-17T10:30:00Z',
      txHashFrom: '0xa1b2c3d4e5f6789...',
      txHashTo: '0x9876543210abcdef...',
      fee: 0.001,
      confirmations: 12,
      requiredConfirmations: 12
    },
    {
      id: '2',
      bridgeId: '2',
      fromChain: 'Kaspa',
      toChain: 'Polygon',
      asset: 'KAS',
      amount: 1000,
      status: 'pending',
      timestamp: '2025-01-17T11:15:00Z',
      txHashFrom: '0xfedcba0987654321...',
      txHashTo: '',
      fee: 0.0005,
      confirmations: 8,
      requiredConfirmations: 12
    },
    {
      id: '3',
      bridgeId: '4',
      fromChain: 'Solana',
      toChain: 'Kaspa',
      asset: 'SOL',
      amount: 5.5,
      status: 'confirming',
      timestamp: '2025-01-17T11:45:00Z',
      txHashFrom: '0x123456789abcdef...',
      txHashTo: '0xdef456789012345...',
      fee: 0.0003,
      confirmations: 3,
      requiredConfirmations: 8
    }
  ];

  const chainMetrics: ChainMetrics[] = [
    {
      chainId: 'kaspa-mainnet',
      name: 'Kaspa',
      symbol: 'KAS',
      logo: '🟪',
      blockHeight: 4250000,
      blockTime: 1,
      gasPrice: 0.00001,
      status: 'online',
      provenanceRecords: 150000,
      lastSync: '2025-01-17T11:50:00Z'
    },
    {
      chainId: 'ethereum-mainnet',
      name: 'Ethereum',
      symbol: 'ETH',
      logo: '⟠',
      blockHeight: 19200000,
      blockTime: 12,
      gasPrice: 0.000025,
      status: 'online',
      provenanceRecords: 25000,
      lastSync: '2025-01-17T11:49:00Z'
    },
    {
      chainId: 'polygon-mainnet',
      name: 'Polygon',
      symbol: 'MATIC',
      logo: '🟣',
      blockHeight: 52000000,
      blockTime: 2,
      gasPrice: 0.00003,
      status: 'online',
      provenanceRecords: 18000,
      lastSync: '2025-01-17T11:48:00Z'
    },
    {
      chainId: 'solana-mainnet',
      name: 'Solana',
      symbol: 'SOL',
      logo: '🟡',
      blockHeight: 240000000,
      blockTime: 0.4,
      gasPrice: 0.000005,
      status: 'syncing',
      provenanceRecords: 8500,
      lastSync: '2025-01-17T11:45:00Z'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
      case 'completed':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'maintenance':
      case 'syncing':
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'inactive':
      case 'offline':
      case 'failed':
        return <Badge className="bg-red-500">{status}</Badge>;
      case 'confirming':
        return <Badge className="bg-blue-500">{status}</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const initiateTransfer = (bridgeId: string) => {
    const bridge = bridges.find(b => b.id === bridgeId);
    if (bridge) {
      alert(`Initiating cross-chain transfer via ${bridge.name}`);
    }
  };

  const calculateTotalTVL = () => {
    return bridges.reduce((sum, bridge) => sum + bridge.tvl, 0);
  };

  const calculateTotalVolume = () => {
    return bridges.reduce((sum, bridge) => sum + bridge.dailyVolume, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cross-Chain Interoperability</h2>
          <p className="text-muted-foreground">
            Connect with other blockchain networks for enhanced functionality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configure Bridges</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(calculateTotalTVL() / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Across {bridges.length} bridges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(calculateTotalVolume() / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              24h trading volume
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Bridges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bridges.filter(b => b.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational bridges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Supported Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainMetrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Connected networks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bridges">Bridges</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="metrics">Chain Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="bridges" className="space-y-4">
          <div className="grid gap-4">
            {bridges.map((bridge) => (
              <Card key={bridge.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{bridge.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(bridge.status)}
                      {getSecurityIcon(bridge.securityLevel)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{bridge.sourceChain}</span>
                    <ArrowLeftRight className="h-3 w-3" />
                    <span>{bridge.targetChain}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">${(bridge.tvl / 1000000).toFixed(1)}M</div>
                      <div className="text-xs text-muted-foreground">TVL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{bridge.fee}</div>
                      <div className="text-xs text-muted-foreground">Fee</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{bridge.processingTime}min</div>
                      <div className="text-xs text-muted-foreground">Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">${(bridge.dailyVolume / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Daily Volume</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Supported Assets:</div>
                    <div className="flex flex-wrap gap-1">
                      {bridge.supportedAssets.map((asset, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Protocol: {bridge.protocol}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => initiateTransfer(bridge.id)}
                        disabled={bridge.status !== 'active'}
                      >
                        Transfer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4">
            {transactions.map((tx) => {
              const bridge = bridges.find(b => b.id === tx.bridgeId);
              return (
                <Card key={tx.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-green-500" />
                        <CardTitle className="text-lg">{tx.fromChain} → {tx.toChain}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(tx.status)}
                        <Badge variant="outline" className="text-xs">
                          {tx.asset}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Amount:</span> {tx.amount} {tx.asset}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Fee:</span> {tx.fee} KAS
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Bridge:</span> {bridge?.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">From TX:</span> 
                          <code className="ml-1 text-xs">{tx.txHashFrom.substring(0, 10)}...</code>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">To TX:</span> 
                          <code className="ml-1 text-xs">{tx.txHashTo ? `${tx.txHashTo.substring(0, 10)}...` : 'Pending'}</code>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Time:</span> {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confirmations</span>
                        <span>{tx.confirmations}/{tx.requiredConfirmations}</span>
                      </div>
                      <Progress value={(tx.confirmations / tx.requiredConfirmations) * 100} className="h-2" />
                    </div>

                    {tx.status === 'pending' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Transaction is pending confirmation on the destination chain.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {chainMetrics.map((chain) => (
              <Card key={chain.chainId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{chain.logo}</span>
                      <CardTitle className="text-lg">{chain.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(chain.status)}
                      <Badge variant="outline" className="text-xs">
                        {chain.symbol}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{chain.blockHeight.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Block Height</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{chain.blockTime}s</div>
                      <div className="text-xs text-muted-foreground">Block Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{chain.gasPrice}</div>
                      <div className="text-xs text-muted-foreground">Gas Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{chain.provenanceRecords.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Provenance Records</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last Sync: {new Date(chain.lastSync).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Explorer
                      </Button>
                      <Button size="sm" variant="outline">
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}