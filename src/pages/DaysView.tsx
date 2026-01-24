import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const DaysView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Days View</h1>
        <p className="text-muted-foreground">
          View your trading performance organized by day
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Trading Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Days view content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DaysView;
