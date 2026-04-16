import { Button } from "@/shared/ui/button";
import { MailIcon, ArrowRightIcon, PlusIcon } from "lucide-react";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function ButtonPage() {
  return (
    <>
      <h1>Button</h1>
      <p>
        <code>goose2/src/shared/ui/button.tsx</code> — Primary action element
        with pill radius (999px) and 9 variants.
      </p>

      <h2>Variants</h2>
      <ComponentPreview label="All variants">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </ComponentPreview>

      <h2>Sizes</h2>
      <ComponentPreview label="Size scale">
        <Button size="lg">Large</Button>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="icon"><PlusIcon size={18} /></Button>
      </ComponentPreview>

      <h2>With Icons</h2>
      <ComponentPreview label="Icon placement">
        <Button><MailIcon size={16} /> Send Email</Button>
        <Button variant="outline">Continue <ArrowRightIcon size={16} /></Button>
      </ComponentPreview>

      <h2>Disabled</h2>
      <ComponentPreview label="Disabled state">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
        <Button variant="secondary" disabled>Disabled Secondary</Button>
      </ComponentPreview>
    </>
  );
}
