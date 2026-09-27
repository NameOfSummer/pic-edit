import { Editor } from "@/components/Editor";
import { Toaster } from "@/components/ui/sonner";

/**
 * アプリのルート。エディタとトーストを置く。
 * @returns {JSX.Element} 画面全体
 */
export function App() {
  return (
    <>
      <Editor />
      <Toaster richColors closeButton={false} />
    </>
  );
}
