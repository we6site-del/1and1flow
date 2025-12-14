import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import CanvasWrapper from "@/components/canvas/CanvasWrapper";

export default async function FlowPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;

  if (id === "new") {
    const newId = uuidv4();
    redirect(`/${locale}/flow/${newId}`);
  }

  return <CanvasWrapper projectId={id} />;
}
