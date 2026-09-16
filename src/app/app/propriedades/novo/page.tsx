import { isAiEnabled } from "@/lib/ai";
import { NewGuideFlow } from "@/components/new-guide/new-guide-flow";

export default function NewPropertyPage() {
  return <NewGuideFlow aiEnabled={isAiEnabled()} />;
}
