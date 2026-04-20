import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6">
      <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}
