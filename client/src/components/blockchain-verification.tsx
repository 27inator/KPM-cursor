import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Link2, Hash, CheckCircle, AlertTriangle, Clock, Zap, ExternalLink } from 'lucide-react';

interface BlockchainAnchor {
  id: string;
  productId: string;
  eventType: string;
  transactionId: string;
  blockNumber: number;
  timestamp: string;
  merkleRoot: string;
  leafHash: string;
  confirmations: number;
  gasUsed: number;
  status: 'confirmed' | 'pending' | 'failed';
  proofVerified: boolean;
  networkFee: number;
}

interface VerificationAttempt {
  id: string;
  anchorId: string;
  verificationMethod: string;
  result: 'success' | 'failure' | 'pending';
  confidence: number;
  startTime: string;
  endTime: string;
  evidenceCount: number;
  errorMessage?: string;
  validatorNodes: number;
}

interface NetworkHealth {
  network: string;
  status: 'healthy' | 'degraded' | 'offline';
  blockHeight: number;
  lastBlock: string;
  avgBlockTime: number;
  pendingTransactions: number;
  networkHashRate: string;
  difficulty: number;
  gasPrice: number;
}

export default function BlockchainVerification() {
  const [activeTab, setActiveTab] = useState('anchors');
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

  const blockchainAnchors: BlockchainAnchor[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      eventType: 'HARVEST',
      transactionId: '0xa1b2c3d4e5f6789012345678901234567890abcdef',
      blockNumber: 4250125,
      timestamp: '2025-01-10T06:00:00Z',
      merkleRoot: '0x1234567890abcdef1234567890abcdef12345678',
      leafHash: '0xabcdef1234567890abcdef1234567890abcdef12',
      confirmations: 1245,
      gasUsed: 65000,
      status: 'confirmed',
      proofVerified: true,
      networkFee: 0.00012
    },
    {
      id: '2',
      productId: 'prod_organic_tomato_001',
      eventType: 'PROCESS',
      transactionId: '0xb2c3d4e5f6789012345678901234567890abcdef1',
      blockNumber: 4250287,
      timestamp: '2025-01-11T08:30:00Z',
      merkleRoot: '0x234567890abcdef1234567890abcdef123456789',
      leafHash: '0xbcdef1234567890abcdef1234567890abcdef123',
      confirmations: 1083,
      gasUsed: 72000,
      status: 'confirmed',
      proofVerified: true,
      networkFee: 0.00014
    },
    {
      id: '3',
      productId: 'prod_chicken_002',
      eventType: 'QC',
      transactionId: '0xc3d4e5f6789012345678901234567890abcdef12',
      blockNumber: 4250445,
      timestamp: '2025-01-12T10:15:00Z',
      merkleRoot: '0x34567890abcdef1234567890abcdef1234567890',
      leafHash: '0xcdef1234567890abcdef1234567890abcdef1234',
      confirmations: 925,
      gasUsed: 68000,
      status: 'confirmed',
      proofVerified: true,
      networkFee: 0.00013
    },
    {
      id: '4',
      productId: 'prod_salmon_003',
      eventType: 'SHIP',
      transactionId: '0xd4e5f6789012345678901234567890abcdef123',
      blockNumber: 4250598,
      timestamp: '2025-01-15T09:00:00Z',
      merkleRoot: '0x4567890abcdef1234567890abcdef12345678901',
      leafHash: '0xdef1234567890abcdef1234567890abcdef12345',
      confirmations: 772,
      gasUsed: 75000,
      status: 'confirmed',
      proofVerified: true,
      networkFee: 0.00015
    },
    {
      id: '5',
      productId: 'prod_coffee_004',
      eventType: 'HARVEST',
      transactionId: '0xe5f6789012345678901234567890abcdef1234',
      blockNumber: 4250789,
      timestamp: '2025-01-17T08:15:00Z',
      merkleRoot: '0x567890abcdef1234567890abcdef123456789012',
      leafHash: '0xef1234567890abcdef1234567890abcdef123456',
      confirmations: 15,
      gasUsed: 63000,
      status: 'pending',
      proofVerified: false,
      networkFee: 0.00011
    }
  ];

  const verificationAttempts: VerificationAttempt[] = [
    {
      id: '1',
      anchorId: '1',
      verificationMethod: 'Merkle Proof + Timestamp',
      result: 'success',
      confidence: 100,
      startTime: '2025-01-17T10:30:00Z',
      endTime: '2025-01-17T10:30:15Z',
      evidenceCount: 3,
      validatorNodes: 5
    },
    {
      id: '2',
      anchorId: '2',
      verificationMethod: 'Merkle Proof + Timestamp',
      result: 'success',
      confidence: 100,
      startTime: '2025-01-17T10:25:00Z',
      endTime: '2025-01-17T10:25:12Z',
      evidenceCount: 3,
      validatorNodes: 5
    },
    {
      id: '3',
      anchorId: '3',
      verificationMethod: 'Merkle Proof + Timestamp',
      result: 'success',
      confidence: 100,
      startTime: '2025-01-17T10:20:00Z',
      endTime: '2025-01-17T10:20:18Z',
      evidenceCount: 3,
      validatorNodes: 5
    },
    {
      id: '4',
      anchorId: '5',
      verificationMethod: 'Merkle Proof + Timestamp',
      result: 'pending',
      confidence: 85,
      startTime: '2025-01-17T11:00:00Z',
      endTime: '',
      evidenceCount: 2,
      validatorNodes: 3
    }
  ];

  const networkHealth: NetworkHealth = {
    network: 'Kaspa Mainnet',
    status: 'healthy',
    blockHeight: 4250804,
    lastBlock: '2025-01-17T11:50:00Z',
    avgBlockTime: 1.2,
    pendingTransactions: 234,
    networkHashRate: '2.5 PH/s',
    difficulty: 1.234e15,
    gasPrice: 0.00001
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'success':
      case 'healthy':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'failed':
      case 'failure':
      case 'offline':
        return <Badge className="bg-red-500">{status}</Badge>;
      case 'degraded':
        return <Badge className="bg-orange-500">{status}</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const verifyProof = (anchorId: string) => {
    const anchor = blockchainAnchors.find(a => a.id === anchorId);
    if (anchor) {
      alert(`Verifying blockchain proof for transaction ${anchor.transactionId}`);
    }
  };

  const viewOnExplorer = (transactionId: string) => {
    alert(`Opening Kaspa explorer for transaction: ${transactionId}`);
  };

  const confirmedAnchors = blockchainAnchors.filter(a => a.status === 'confirmed').length;
  const totalGasUsed = blockchainAnchors.reduce((sum, a) => sum + a.gasUsed, 0);
  const avgConfirmations = blockchainAnchors.reduce((sum, a) => sum + a.confirmations, 0) / blockchainAnchors.length;
  const verificationSuccessRate = (verificationAttempts.filter(v => v.result === 'success').length / verificationAttempts.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blockchain Verification</h2>
          <p className="text-muted-foreground">
            Cryptographic proof verification and blockchain anchor management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Verify All</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Anchors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedAnchors}</div>
            <p className="text-xs text-muted-foreground">
              Out of {blockchainAnchors.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confirmations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfirmations.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Network confirmations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gas Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGasUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Blockchain operations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verificationSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="anchors">Blockchain Anchors</TabsTrigger>
          <TabsTrigger value="verification">Verification History</TabsTrigger>
          <TabsTrigger value="network">Network Health</TabsTrigger>
        </TabsList>

        <TabsContent value="anchors" className="space-y-4">
          <div className="grid gap-4">
            {blockchainAnchors.map((anchor) => (
              <Card key={anchor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{anchor.eventType} Event</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(anchor.status)}
                      {anchor.proofVerified && <Badge className="bg-green-500">Verified</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Product: {anchor.productId}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Transaction ID:</span>
                        <code className="ml-1 text-xs">{anchor.transactionId.substring(0, 20)}...</code>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Block Number:</span> {anchor.blockNumber.toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Confirmations:</span> {anchor.confirmations}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Gas Used:</span> {anchor.gasUsed.toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Network Fee:</span> {anchor.networkFee} KAS
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Timestamp:</span> {new Date(anchor.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Cryptographic Hashes:</div>
                    <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                      <div><span className="font-medium">Merkle Root:</span> {anchor.merkleRoot}</div>
                      <div><span className="font-medium">Leaf Hash:</span> {anchor.leafHash}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Block: {anchor.blockNumber} • {anchor.confirmations} confirmations
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => viewOnExplorer(anchor.transactionId)}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explorer
                      </Button>
                      <Button size="sm" onClick={() => verifyProof(anchor.id)}>
                        Verify Proof
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="grid gap-4">
            {verificationAttempts.map((attempt) => {
              const anchor = blockchainAnchors.find(a => a.id === attempt.anchorId);
              return (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <CardTitle className="text-lg">Verification Attempt</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(attempt.result)}
                        <Badge variant="outline" className={`text-xs ${getConfidenceColor(attempt.confidence)}`}>
                          {attempt.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {anchor?.eventType} • {anchor?.productId}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Method:</span> {attempt.verificationMethod}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Evidence Count:</span> {attempt.evidenceCount}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Validator Nodes:</span> {attempt.validatorNodes}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Start Time:</span> {new Date(attempt.startTime).toLocaleString()}
                        </div>
                        {attempt.endTime && (
                          <div className="text-sm">
                            <span className="font-medium">End Time:</span> {new Date(attempt.endTime).toLocaleString()}
                          </div>
                        )}
                        {attempt.endTime && (
                          <div className="text-sm">
                            <span className="font-medium">Duration:</span> {
                              ((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000).toFixed(1)
                            }s
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Verification Confidence</span>
                        <span>{attempt.confidence}%</span>
                      </div>
                      <Progress value={attempt.confidence} className="h-2" />
                    </div>

                    {attempt.errorMessage && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {attempt.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-lg">{networkHealth.network}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(networkHealth.status)}
                  <Badge variant="outline" className="text-xs">
                    Block {networkHealth.blockHeight.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{networkHealth.avgBlockTime}s</div>
                  <div className="text-xs text-muted-foreground">Avg Block Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{networkHealth.pendingTransactions}</div>
                  <div className="text-xs text-muted-foreground">Pending TX</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{networkHealth.networkHashRate}</div>
                  <div className="text-xs text-muted-foreground">Hash Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{networkHealth.gasPrice}</div>
                  <div className="text-xs text-muted-foreground">Gas Price</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Last Block:</span> {new Date(networkHealth.lastBlock).toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Difficulty:</span> {networkHealth.difficulty.toExponential(3)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Current Height:</span> {networkHealth.blockHeight.toLocaleString()}
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Network is operating normally. All blockchain anchors are being processed efficiently.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}