import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Book, Shirt, Calendar, Users } from "lucide-react";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  external_link: string | null;
  image_url: string | null;
}

const categoryIcons = {
  book: Book,
  merch: Shirt,
  event: Calendar,
  workshop: Users,
};

const Marketplace = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) setItems(data);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Wellness Marketplace</h2>
        <p className="text-muted-foreground">
          Resources and products to support your mental health journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const Icon = categoryIcons[item.category as keyof typeof categoryIcons];
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-elevated transition-shadow">
              {item.image_url && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xl font-bold text-primary">${item.price}</p>
                </div>

                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>

                {item.external_link && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(item.external_link!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
