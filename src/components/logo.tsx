import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <GraduationCap className="h-6 w-6 text-primary" />
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        Peak Prep
      </h2>
    </div>
  );
}
