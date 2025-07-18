import { EmailSubjectForm } from '@/components/email-subject-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function EmailSubjectGeneratorPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          AI-Powered Email Subject Generator
        </h1>
        <p className="text-muted-foreground">
          Generate engaging and relevant subject lines for your assignment emails.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generate Subject Line</CardTitle>
            <CardDescription>
              Fill in the details below to generate a custom email subject line
              and a suggested difficulty for the assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailSubjectForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
