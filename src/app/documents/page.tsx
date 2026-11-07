import type { Metadata } from "next";
import { DocumentsPage } from "@/components/documents/documents-page";

export const metadata: Metadata = {
  title: "Documents | CampusFlow",
  description: "Privately share documents with your company workspace.",
};

export default function DocumentsRoute() {
  return <DocumentsPage />;
}
