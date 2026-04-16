import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-background-inverse text-text-inverse hover:bg-background-inverse/85 active:bg-background-inverse/80 shadow-sm',
        destructive:
          'bg-background-danger text-white hover:bg-background-danger/90 active:bg-background-danger/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-background-danger/80 shadow-sm',
        outline:
          'border border-border-primary bg-transparent hover:bg-background-secondary active:bg-background-tertiary',
        secondary:
          'bg-background-secondary text-text-primary hover:bg-background-tertiary active:bg-background-tertiary/80 shadow-sm',
        ghost:
          'hover:bg-background-secondary dark:hover:bg-background-secondary/50 active:bg-background-tertiary',
        link: 'text-text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 gap-1 text-xs ![&_svg:not([class*="size-"])]:size-3',
        default: 'h-9',
        sm: 'h-8 gap-1.5',
        lg: 'h-10',
      },
      shape: {
        pill: 'rounded-full',
        round: '',
      },
    },
    compoundVariants: [
      {
        shape: 'pill',
        size: 'xs',
        className: 'px-3 has-[>svg]:px-2.5',
      },
      {
        shape: 'pill',
        size: 'default',
        className: 'px-5 py-2 has-[>svg]:px-4',
      },
      {
        shape: 'pill',
        size: 'sm',
        className: 'px-4 has-[>svg]:px-3.5',
      },
      {
        shape: 'pill',
        size: 'lg',
        className: 'px-6 has-[>svg]:px-5',
      },
      {
        shape: 'round',
        size: 'xs',
        className: 'w-7 h-7 p-0 rounded-full',
      },
      {
        shape: 'round',
        size: 'default',
        className: 'w-9 h-9 p-0 rounded-full',
      },
      {
        shape: 'round',
        size: 'sm',
        className: 'w-8 h-8 p-0 rounded-full',
      },
      {
        shape: 'round',
        size: 'lg',
        className: 'w-10 h-10 p-0 rounded-full',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'pill',
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
      shape?: 'pill' | 'round';
    }
>(({ className, variant, size, asChild = false, shape = 'pill', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
