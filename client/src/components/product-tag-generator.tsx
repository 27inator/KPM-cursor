import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QrCode, Package, MapPin, Calendar } from "lucide-react";

interface ProductTagData {
  tagId: string;
  productName: string;
  productType: string;
  origin: string;
  harvestDate: string;
  expiryDate: string;
  batchId: string;
  farmId: string;
  certifications: string[];
  description: string;
}

export default function ProductTagGenerator() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductTagData>({
    tagId: `TAG-${Date.now().toString().slice(-6)}`,
    productName: "",
    productType: "",
    origin: "",
    harvestDate: "",
    expiryDate: "",
    batchId: "",
    farmId: "",
    certifications: [],
    description: ""
  });
  const [newCertification, setNewCertification] = useState("");

  const createTagMutation = useMutation({
    mutationFn: async (data: ProductTagData) => {
      const response = await apiRequest('POST', '/api/product-tags', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product tag created successfully",
        description: "The product tag has been registered and is ready for supply chain tracking",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/product-tags'] });
      // Reset form
      setFormData({
        tagId: `TAG-${Date.now().toString().slice(-6)}`,
        productName: "",
        productType: "",
        origin: "",
        harvestDate: "",
        expiryDate: "",
        batchId: "",
        farmId: "",
        certifications: [],
        description: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create product tag",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: keyof ProductTagData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.productType || !formData.origin) {
      toast({
        title: "Missing required fields",
        description: "Please fill in product name, type, and origin",
        variant: "destructive",
      });
      return;
    }
    createTagMutation.mutate(formData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Tag Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagId">Product Tag ID</Label>
              <div className="relative">
                <QrCode className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="tagId"
                  value={formData.tagId}
                  onChange={(e) => handleInputChange('tagId', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="e.g., Organic Tomatoes"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType">Product Type</Label>
              <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="seafood">Seafood</SelectItem>
                  <SelectItem value="processed">Processed Food</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  placeholder="e.g., California, USA"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvestDate">Harvest Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="harvestDate"
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchId">Batch ID</Label>
              <Input
                id="batchId"
                value={formData.batchId}
                onChange={(e) => handleInputChange('batchId', e.target.value)}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmId">Farm ID</Label>
              <Input
                id="farmId"
                value={formData.farmId}
                onChange={(e) => handleInputChange('farmId', e.target.value)}
                placeholder="e.g., FARM-CA-123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="e.g., Organic, Fair Trade, Non-GMO"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              />
              <Button type="button" variant="outline" onClick={addCertification}>
                Add
              </Button>
            </div>
            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeCertification(cert)}>
                    {cert} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional product details, handling instructions, etc."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createTagMutation.isPending}>
            {createTagMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Product Tag...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate Product Tag
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}