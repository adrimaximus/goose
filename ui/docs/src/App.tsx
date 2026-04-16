import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { DocsLayout } from "./components/DocsLayout";

const Overview = lazy(() => import("./pages/Overview"));
const Tokens = lazy(() => import("./pages/Tokens"));
const Components = lazy(() => import("./pages/Components"));
const AiElements = lazy(() => import("./pages/AiElements"));

const Button = lazy(() => import("./pages/components/Button"));
const Input = lazy(() => import("./pages/components/Input"));
const Card = lazy(() => import("./pages/components/Card"));
const Dialog = lazy(() => import("./pages/components/Dialog"));
const Tabs = lazy(() => import("./pages/components/Tabs"));

const Message = lazy(() => import("./pages/ai-elements/Message"));
const Tool = lazy(() => import("./pages/ai-elements/Tool"));
const CodeBlock = lazy(() => import("./pages/ai-elements/CodeBlock"));
const PromptInput = lazy(() => import("./pages/ai-elements/PromptInput"));
const Plan = lazy(() => import("./pages/ai-elements/Plan"));

export function App() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", opacity: 0.4 }}>Loading...</div>}>
      <Routes>
        <Route element={<DocsLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/components" element={<Components />} />
          <Route path="/components/button" element={<Button />} />
          <Route path="/components/input" element={<Input />} />
          <Route path="/components/card" element={<Card />} />
          <Route path="/components/dialog" element={<Dialog />} />
          <Route path="/components/tabs" element={<Tabs />} />
          <Route path="/ai-elements" element={<AiElements />} />
          <Route path="/ai-elements/message" element={<Message />} />
          <Route path="/ai-elements/tool" element={<Tool />} />
          <Route path="/ai-elements/code-block" element={<CodeBlock />} />
          <Route path="/ai-elements/prompt-input" element={<PromptInput />} />
          <Route path="/ai-elements/plan" element={<Plan />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
