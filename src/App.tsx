import { Editor } from "@/components/Editor";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <>
      <Editor />
      <Toaster richColors closeButton={false} />
    </>
  );
}
