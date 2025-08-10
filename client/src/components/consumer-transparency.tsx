import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Smartphone, QrCode, Share2, TrendingUp, Users, Star, MessageCircle } from 'lucide-react';

interface ConsumerEngagement {
  id: string;
  productId: string;
  productName: string;
  totalScans: number;
  uniqueConsumers: number;
  averageRating: number;
  transparencyViews: number;
  journeyCompletions: number;
  shareCount: number;
  feedbackCount: number;
  lastScan: string;
  popularQuestions: string[];
  verificationRequests: number;
}

interface TransparencyPage {
  id: string;
  productId: string;
  title: string;
  description: string;
  sections: {
    origin: boolean;
    journey: boolean;
    certifications: boolean;
    quality: boolean;
    sustainability: boolean;
  };
  qrCodeUrl: string;
  publicUrl: string;
  viewCount: number;
  lastUpdated: string;
  consumerRating: number;
  featured: boolean;
}

interface ConsumerFeedback {
  id: string;
  productId: string;
  consumerName: string;
  rating: number;
  comment: string;
  timestamp: string;
  verified: boolean;
  helpfulVotes: number;
  category: 'quality' | 'transparency' | 'packaging' | 'origin' | 'general';
  response?: string;
}

export default function ConsumerTransparency() {
  const [activeTab, setActiveTab] = useState('engagement');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const engagementData: ConsumerEngagement[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      productName: 'Organic Cherry Tomatoes',
      totalScans: 2847,
      uniqueConsumers: 1923,
      averageRating: 4.8,
      transparencyViews: 1654,
      journeyCompletions: 1234,
      shareCount: 567,
      feedbackCount: 234,
      lastScan: '2025-01-17T11:45:00Z',
      popularQuestions: ['Where were these grown?', 'What pesticides were used?', 'How fresh are they?'],
      verificationRequests: 45
    },
    {
      id: '2',
      productId: 'prod_chicken_002',
      productName: 'Free-Range Chicken',
      totalScans: 1892,
      uniqueConsumers: 1456,
      averageRating: 4.6,
      transparencyViews: 1234,
      journeyCompletions: 987,
      shareCount: 312,
      feedbackCount: 156,
      lastScan: '2025-01-17T10:30:00Z',
      popularQuestions: ['How were the chickens raised?', 'What did they eat?', 'Is it truly free-range?'],
      verificationRequests: 23
    },
    {
      id: '3',
      productId: 'prod_salmon_003',
      productName: 'Wild Salmon',
      totalScans: 3456,
      uniqueConsumers: 2234,
      averageRating: 4.9,
      transparencyViews: 2123,
      journeyCompletions: 1876,
      shareCount: 789,
      feedbackCount: 345,
      lastScan: '2025-01-17T12:00:00Z',
      popularQuestions: ['Where was this caught?', 'Is it really wild?', 'How was it processed?'],
      verificationRequests: 67
    }
  ];

  const transparencyPages: TransparencyPage[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      title: 'Organic Cherry Tomatoes - Farm to Table',
      description: 'Follow our organic cherry tomatoes from Green Valley Farm to your table',
      sections: {
        origin: true,
        journey: true,
        certifications: true,
        quality: true,
        sustainability: true
      },
      qrCodeUrl: 'https://kmp.replit.app/product/prod_organic_tomato_001/qr',
      publicUrl: 'https://kmp.replit.app/transparency/prod_organic_tomato_001',
      viewCount: 1654,
      lastUpdated: '2025-01-17T10:30:00Z',
      consumerRating: 4.8,
      featured: true
    },
    {
      id: '2',
      productId: 'prod_chicken_002',
      title: 'Free-Range Chicken - Ethical Sourcing',
      description: 'Discover how our free-range chickens are ethically raised and processed',
      sections: {
        origin: true,
        journey: true,
        certifications: true,
        quality: true,
        sustainability: false
      },
      qrCodeUrl: 'https://kmp.replit.app/product/prod_chicken_002/qr',
      publicUrl: 'https://kmp.replit.app/transparency/prod_chicken_002',
      viewCount: 1234,
      lastUpdated: '2025-01-17T09:45:00Z',
      consumerRating: 4.6,
      featured: false
    },
    {
      id: '3',
      productId: 'prod_salmon_003',
      title: 'Wild Salmon - Ocean to Plate',
      description: 'Experience the complete journey of our sustainably caught wild salmon',
      sections: {
        origin: true,
        journey: true,
        certifications: true,
        quality: true,
        sustainability: true
      },
      qrCodeUrl: 'https://kmp.replit.app/product/prod_salmon_003/qr',
      publicUrl: 'https://kmp.replit.app/transparency/prod_salmon_003',
      viewCount: 2123,
      lastUpdated: '2025-01-17T11:00:00Z',
      consumerRating: 4.9,
      featured: true
    }
  ];

  const consumerFeedback: ConsumerFeedback[] = [
    {
      id: '1',
      productId: 'prod_organic_tomato_001',
      consumerName: 'Sarah M.',
      rating: 5,
      comment: 'Amazing transparency! I can see exactly where my tomatoes came from and how they were grown. This builds so much trust.',
      timestamp: '2025-01-17T10:15:00Z',
      verified: true,
      helpfulVotes: 23,
      category: 'transparency',
      response: 'Thank you Sarah! Transparency is at the heart of what we do.'
    },
    {
      id: '2',
      productId: 'prod_chicken_002',
      consumerName: 'Mike R.',
      rating: 4,
      comment: 'Great to see the farm conditions and processing facility. Would love more details about the feed used.',
      timestamp: '2025-01-17T09:30:00Z',
      verified: true,
      helpfulVotes: 18,
      category: 'origin',
      response: 'Thanks Mike! We\'re adding more feed details to our transparency page.'
    },
    {
      id: '3',
      productId: 'prod_salmon_003',
      consumerName: 'Jennifer L.',
      rating: 5,
      comment: 'The blockchain verification gives me confidence this is truly wild-caught. Excellent quality!',
      timestamp: '2025-01-17T11:20:00Z',
      verified: true,
      helpfulVotes: 31,
      category: 'quality'
    },
    {
      id: '4',
      productId: 'prod_organic_tomato_001',
      consumerName: 'David K.',
      rating: 5,
      comment: 'Love being able to scan the QR code and see the complete journey. This is the future of food transparency!',
      timestamp: '2025-01-17T08:45:00Z',
      verified: true,
      helpfulVotes: 27,
      category: 'transparency'
    }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      quality: 'bg-blue-500',
      transparency: 'bg-green-500',
      packaging: 'bg-purple-500',
      origin: 'bg-orange-500',
      general: 'bg-gray-500'
    };
    return <Badge className={colors[category as keyof typeof colors]}>{category}</Badge>;
  };

  const generateQRCode = (productId: string) => {
    alert(`Generating QR code for consumer transparency page: ${productId}`);
  };

  const viewPublicPage = (url: string) => {
    window.open(url, '_blank');
  };

  const totalScans = engagementData.reduce((sum, e) => sum + e.totalScans, 0);
  const totalUniqueConsumers = engagementData.reduce((sum, e) => sum + e.uniqueConsumers, 0);
  const averageRating = engagementData.reduce((sum, e) => sum + e.averageRating, 0) / engagementData.length;
  const totalShares = engagementData.reduce((sum, e) => sum + e.shareCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Consumer Transparency</h2>
          <p className="text-muted-foreground">
            Consumer-facing transparency features and engagement analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center space-x-2">
            <QrCode className="h-4 w-4" />
            <span>Generate QR Codes</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Consumers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueConsumers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Engaged users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(averageRating)}`}>
              {averageRating.toFixed(1)}★
            </div>
            <p className="text-xs text-muted-foreground">
              Consumer satisfaction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Social sharing
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engagement">Consumer Engagement</TabsTrigger>
          <TabsTrigger value="pages">Transparency Pages</TabsTrigger>
          <TabsTrigger value="feedback">Consumer Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4">
            {engagementData.map((engagement) => (
              <Card key={engagement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-lg">{engagement.productName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${getRatingColor(engagement.averageRating)}`}>
                        {engagement.averageRating}★
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {engagement.uniqueConsumers} consumers
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Product ID: {engagement.productId}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{engagement.totalScans}</div>
                      <div className="text-xs text-muted-foreground">Total Scans</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{engagement.transparencyViews}</div>
                      <div className="text-xs text-muted-foreground">Page Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{engagement.journeyCompletions}</div>
                      <div className="text-xs text-muted-foreground">Journey Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{engagement.shareCount}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Journey Completion Rate</span>
                      <span>{((engagement.journeyCompletions / engagement.transparencyViews) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(engagement.journeyCompletions / engagement.transparencyViews) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Popular Questions:</div>
                    <div className="flex flex-wrap gap-1">
                      {engagement.popularQuestions.map((question, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last Scan: {new Date(engagement.lastScan).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        View Analytics
                      </Button>
                      <Button size="sm">
                        Optimize Page
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="grid gap-4">
            {transparencyPages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      {page.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${getRatingColor(page.consumerRating)}`}>
                        {page.consumerRating}★
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {page.viewCount} views
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className={`text-sm font-medium ${page.sections.origin ? 'text-green-600' : 'text-gray-400'}`}>
                        Origin
                      </div>
                      <div className="text-xs">{page.sections.origin ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${page.sections.journey ? 'text-green-600' : 'text-gray-400'}`}>
                        Journey
                      </div>
                      <div className="text-xs">{page.sections.journey ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${page.sections.certifications ? 'text-green-600' : 'text-gray-400'}`}>
                        Certs
                      </div>
                      <div className="text-xs">{page.sections.certifications ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${page.sections.quality ? 'text-green-600' : 'text-gray-400'}`}>
                        Quality
                      </div>
                      <div className="text-xs">{page.sections.quality ? '✓' : '✗'}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${page.sections.sustainability ? 'text-green-600' : 'text-gray-400'}`}>
                        Sustain
                      </div>
                      <div className="text-xs">{page.sections.sustainability ? '✓' : '✗'}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Public URL:</span> 
                      <code className="ml-1 text-xs">{page.publicUrl}</code>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">QR Code:</span> 
                      <code className="ml-1 text-xs">{page.qrCodeUrl}</code>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Updated: {new Date(page.lastUpdated).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => viewPublicPage(page.publicUrl)}>
                        View Public
                      </Button>
                      <Button size="sm" onClick={() => generateQRCode(page.productId)}>
                        Generate QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4">
            {consumerFeedback.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-lg">{feedback.consumerName}</CardTitle>
                      {feedback.verified && <Badge className="bg-green-500">Verified</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${getRatingColor(feedback.rating)}`}>
                        {feedback.rating}★
                      </div>
                      {getCategoryBadge(feedback.category)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transparencyPages.find(p => p.productId === feedback.productId)?.title}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{feedback.comment}</p>
                  </div>

                  {feedback.response && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">Response:</div>
                      <p className="text-sm text-blue-800">{feedback.response}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {new Date(feedback.timestamp).toLocaleString()} • {feedback.helpfulVotes} helpful votes
                    </div>
                    <div className="flex items-center space-x-2">
                      {!feedback.response && (
                        <Button size="sm" variant="outline">
                          Reply
                        </Button>
                      )}
                      <Button size="sm">
                        View Product
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