import { cn } from '../../utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-background-secondary animate-pulse rounded-xl', className)}
      {...props}
    />
  );
}

export { Skeleton };
