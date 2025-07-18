import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AssignmentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Assignment Management
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            This section is under construction. Here you will be able to manage your assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <FileText className="h-16 w-16" />
          <p>Assignment list will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
