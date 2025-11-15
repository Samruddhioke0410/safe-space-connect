import { AlertTriangle, Phone, MessageSquare, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CrisisModalProps {
  open: boolean;
  onClose: () => void;
  level: 'high' | 'medium' | 'low';
}

const CrisisModal = ({ open, onClose, level }: CrisisModalProps) => {
  const resources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "24/7 crisis support",
      urgent: true,
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Free 24/7 text support",
      urgent: true,
    },
    {
      name: "SAMHSA National Helpline",
      phone: "1-800-662-4357",
      description: "Mental health and substance abuse support",
      urgent: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${level === 'high' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
              <AlertTriangle className={`h-6 w-6 ${level === 'high' ? 'text-destructive' : 'text-warning'}`} />
            </div>
            <DialogTitle className="text-2xl">
              {level === 'high' ? 'Immediate Support Available' : 'Support Resources'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {level === 'high' 
              ? "We noticed you may be in distress. You don't have to face this alone. Help is available right now."
              : "It sounds like you're going through a difficult time. Here are some resources that might help."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {resources.map((resource, index) => (
            <Card key={index} className={`p-4 ${resource.urgent && level === 'high' ? 'border-destructive border-2' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{resource.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{resource.description}</p>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    {resource.phone.includes('Text') ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    <span>{resource.phone}</span>
                  </div>
                </div>
                <Button
                  variant={resource.urgent && level === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => window.open(`tel:${resource.phone.replace(/\D/g, '')}`, '_blank')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </div>
            </Card>
          ))}

          <Card className="p-4 bg-muted">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Online Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  988 Lifeline Website
                </a>
              </li>
              <li>
                <a href="https://www.crisistextline.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Crisis Text Line
                </a>
              </li>
            </ul>
          </Card>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Remember: Reaching out is a sign of strength
          </p>
          <Button onClick={onClose} variant="outline">
            Continue to Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CrisisModal;
