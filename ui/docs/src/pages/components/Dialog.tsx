import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function DialogPage() {
  return (
    <>
      <h1>Dialog & Overlay</h1>

      <h2>Dialog</h2>
      <p>
        <code>goose2/src/shared/ui/dialog.tsx</code> — Radix Dialog wrapper with
        modal overlay.
      </p>
      <ComponentPreview label="Click to open">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to proceed? This will update your settings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Confirm</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentPreview>

      <h2>Without Close Button</h2>
      <ComponentPreview label="showCloseButton=false">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Without X</Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Important Notice</DialogTitle>
              <DialogDescription>
                This dialog can only be dismissed via the action buttons below.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Acknowledge</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentPreview>

      <h2>Parts</h2>
      <ul>
        <li><code>Dialog</code> — Root (controls open/close state)</li>
        <li><code>DialogTrigger</code> — Opens the dialog</li>
        <li><code>DialogContent</code> — Modal panel with overlay</li>
        <li><code>DialogHeader</code> / <code>DialogTitle</code> / <code>DialogDescription</code></li>
        <li><code>DialogFooter</code> — Action buttons area</li>
        <li><code>DialogClose</code> — Closes the dialog</li>
      </ul>
    </>
  );
}
