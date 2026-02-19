import { type ReactElement } from 'react';
import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FieldHelpTooltipProps {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function FieldHelpTooltip({ text, side = 'top', className }: FieldHelpTooltipProps): ReactElement {
  return (
    <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={text}
            tabIndex={0}
            className={cn(
              'inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-help ml-1 shrink-0',
              className
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }}
          >
            <CircleHelp size={14} strokeWidth={2} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
  );
}
