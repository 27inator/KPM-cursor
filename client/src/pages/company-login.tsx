import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, Lock, User, AlertCircle, ArrowLeft, Home } from "lucide-react";

interface CompanyLoginData {
  companyId: string;
  accessCode: string;
}

export default function CompanyLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CompanyLoginData>({
    companyId: "",
    accessCode: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (data: CompanyLoginData) => {
      const response = await apiRequest('POST', '/api/company-auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store company authentication
      localStorage.setItem('companyToken', data.token);
      localStorage.setItem('companyId', data.companyId);
      localStorage.setItem('companyName', data.companyName);
      
      toast({
        title: "Login successful",
        description: `Welcome to ${data.companyName} portal`,
      });
      
      setLocation('/company-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid company ID or access code",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.accessCode) {
      toast({
        title: "Missing information",
        description: "Please enter both company ID and access code",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CompanyLoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/company-portal')}
          title="Go to Company Home"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-kaspa-500 rounded-full flex items-center justify-center">
            <Building className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Company Portal</CardTitle>
          <p className="text-gray-600">Sign in to your company dashboard</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyId"
                  type="text"
                  placeholder="comp_1234567890"
                  value={formData.companyId}
                  onChange={(e) => handleInputChange('companyId', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="accessCode"
                  type="password"
                  placeholder="Enter your access code"
                  value={formData.accessCode}
                  onChange={(e) => handleInputChange('accessCode', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Access:</strong> Use company ID "comp_1234567890" with access code "demo123"
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}