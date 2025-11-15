import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PIIWarningProps {
  types: string[];
  onEdit: () => void;
}

const PIIWarning = ({ types, onEdit }: PIIWarningProps) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <Shield className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Personal Information Detected
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Your message appears to contain: <strong>{types.join(', ')}</strong>.
        </p>
        <p className="mb-3">
          Sharing personal information (names, addresses, phone numbers, emails) can put you or others at risk.
          To protect your anonymity, please remove this information before sending.
        </p>
        <button
          onClick={onEdit}
          className="text-sm font-semibold underline hover:no-underline"
        >
          Edit message
        </button>
      </AlertDescription>
    </Alert>
  );
};

export default PIIWarning;
