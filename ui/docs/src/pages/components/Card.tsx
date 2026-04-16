import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function CardPage() {
  return (
    <>
      <h1>Card</h1>
      <p>
        <code>goose2/src/shared/ui/card.tsx</code> — Content container with 20px
        radius and structured slots.
      </p>

      <h2>Basic</h2>
      <ComponentPreview label="Header + content">
        <Card style={{ width: 360 }}>
          <CardHeader>
            <CardTitle>Project Settings</CardTitle>
            <CardDescription>Manage your project configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-subtle)" }}>
              Configure API keys, environment variables, and deployment targets.
            </p>
          </CardContent>
        </Card>
      </ComponentPreview>

      <h2>With Footer</h2>
      <ComponentPreview label="Header + content + footer with actions">
        <Card style={{ width: 360 }}>
          <CardHeader>
            <CardTitle>Deploy</CardTitle>
            <CardDescription>Push changes to production</CardDescription>
          </CardHeader>
          <CardContent>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-subtle)" }}>
              All checks passed. Ready to deploy.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Deploy Now</Button>
          </CardFooter>
        </Card>
      </ComponentPreview>

      <h2>With Badge</h2>
      <ComponentPreview label="Card with status badge">
        <Card style={{ width: 360 }}>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle>API Status</CardTitle>
              <Badge variant="secondary">Healthy</Badge>
            </div>
            <CardDescription>Last checked 2 minutes ago</CardDescription>
          </CardHeader>
        </Card>
      </ComponentPreview>
    </>
  );
}
