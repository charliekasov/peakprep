
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusIcon, PlusIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface StepperProps {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Stepper({ value = 0, onValueChange, min = 0, max = 100, step = 1 }: StepperProps) {
  const handleValueChange = (newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onValueChange?.(clampedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numberValue = e.target.valueAsNumber;
    if (!isNaN(numberValue)) {
      handleValueChange(numberValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => handleValueChange(value - step)}
        disabled={value <= min}
      >
        <MinusIcon className="h-4 w-4" />
        <span className="sr-only">Decrease</span>
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        onBlur={(e) => {
            const numberValue = e.target.valueAsNumber;
            if (!isNaN(numberValue)) {
              handleValueChange(numberValue);
            } else {
              handleValueChange(min); // or some other default
            }
        }}
        min={min}
        max={max}
        step={step}
        className="w-20 text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => handleValueChange(value + step)}
        disabled={value >= max}
      >
        <PlusIcon className="h-4 w-4" />
        <span className="sr-only">Increase</span>
      </Button>
    </div>
  );
}
