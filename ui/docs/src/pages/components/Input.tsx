import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function InputPage() {
  return (
    <>
      <h1>Input & Badge</h1>

      <h2>Input</h2>
      <p><code>goose2/src/shared/ui/input.tsx</code> — Text input with pill radius.</p>

      <ComponentPreview label="Default inputs">
        <Input placeholder="Default input" />
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Input type="number" placeholder="Number" />
      </ComponentPreview>

      <ComponentPreview label="Disabled">
        <Input disabled placeholder="Disabled input" />
      </ComponentPreview>

      <h2>Badge</h2>
      <p><code>goose2/src/shared/ui/badge.tsx</code> — Status indicator.</p>

      <ComponentPreview label="All variants">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </ComponentPreview>
    </>
  );
}
