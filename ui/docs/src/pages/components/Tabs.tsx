import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function TabsPage() {
  return (
    <>
      <h1>Tabs & Accordion</h1>

      <h2>Tabs</h2>
      <p><code>goose2/src/shared/ui/tabs.tsx</code> — Tab switching with Radix Tabs.</p>

      <ComponentPreview label="Interactive tabs">
        <Tabs defaultValue="code" style={{ width: "100%" }}>
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="code">
            <p style={{ padding: "1rem 0", color: "var(--text-subtle)" }}>
              Code editor content goes here.
            </p>
          </TabsContent>
          <TabsContent value="preview">
            <p style={{ padding: "1rem 0", color: "var(--text-subtle)" }}>
              Live preview content goes here.
            </p>
          </TabsContent>
          <TabsContent value="settings">
            <p style={{ padding: "1rem 0", color: "var(--text-subtle)" }}>
              Settings panel content goes here.
            </p>
          </TabsContent>
        </Tabs>
      </ComponentPreview>
    </>
  );
}
