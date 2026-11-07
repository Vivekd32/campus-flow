"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type DocumentWithUploader = DocumentRow & { uploaderName: string };
type DocumentSnapshot = {
  workspaceId: string;
  documents: DocumentWithUploader[];
  error: string;
};

const maximumFileSize = 50 * 1024 * 1024;

export function DocumentsPage() {
  const { activeWorkspace, isHydrated, projects } = useWorkspaceDemo();
  const [snapshot, setSnapshot] = useState<DocumentSnapshot>({
    workspaceId: "",
    documents: [],
    error: "",
  });
  const [projectId, setProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState("");
  const [operationError, setOperationError] = useState<{
    workspaceId: string;
    message: string;
  } | null>(null);
  const activeWorkspaceId = activeWorkspace?.id ?? "";
  const hasWorkspaceSnapshot = snapshot.workspaceId === activeWorkspaceId;
  const documents = hasWorkspaceSnapshot ? snapshot.documents : [];
  const loading = Boolean(activeWorkspaceId) && !hasWorkspaceSnapshot;
  const error = hasWorkspaceSnapshot
    ? snapshot.error
    : "";
  const visibleError =
    operationError?.workspaceId === activeWorkspaceId
      ? operationError.message
      : error;
  const validProjectId = projects.some((project) => project.id === projectId)
    ? projectId
    : "";

  useEffect(() => {
    if (!activeWorkspaceId) return;
    let active = true;
    void loadWorkspaceDocuments(activeWorkspaceId)
      .then((documents) => {
        if (active) {
          setSnapshot({ workspaceId: activeWorkspaceId, documents, error: "" });
          setOperationError((current) =>
            current?.workspaceId === activeWorkspaceId ? null : current,
          );
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setSnapshot({
            workspaceId: activeWorkspaceId,
            documents: [],
            error:
              loadError instanceof Error
                ? loadError.message
                : "Workspace documents could not be loaded.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [activeWorkspaceId]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeWorkspace) return;
    setOperationError(null);
    if (file.size > maximumFileSize) {
      setOperationError({
        workspaceId: activeWorkspace.id,
        message: "Choose a file smaller than 50 MB.",
      });
      return;
    }
    setUploading(true);
    let storagePath = "";
    try {
      const client = createClient();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Sign in again before uploading a document.");
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      storagePath = `${activeWorkspace.id}/${user.id}/${validProjectId || "workspace"}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await client.storage
        .from("workspace-documents")
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const { error: insertError } = await client.from("documents").insert({
        workspace_id: activeWorkspace.id,
        project_id: validProjectId || null,
        uploader_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      if (insertError) {
        const { error: rollbackError } = await client.storage
          .from("workspace-documents")
          .remove([storagePath]);
        if (rollbackError) {
          throw new Error(
            `${insertError.message} The uploaded file could not be cleaned up: ${rollbackError.message}`,
          );
        }
        throw insertError;
      }
      await refreshDocuments();
    } catch (uploadError) {
      setOperationError({
        workspaceId: activeWorkspace.id,
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "The document could not be uploaded.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function refreshDocuments() {
    if (!activeWorkspace) return;
    const documents = await loadWorkspaceDocuments(activeWorkspace.id);
    setSnapshot({ workspaceId: activeWorkspace.id, documents, error: "" });
    setOperationError(null);
  }

  async function downloadDocument(document: DocumentWithUploader) {
    setBusyDocumentId(document.id);
    setOperationError(null);
    try {
      const { data, error: downloadError } = await createClient().storage
        .from("workspace-documents")
        .download(document.storage_path);
      if (downloadError) throw downloadError;
      const url = URL.createObjectURL(data);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.file_name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setOperationError({
        workspaceId: document.workspace_id,
        message:
          downloadError instanceof Error
            ? downloadError.message
            : "The document could not be downloaded.",
      });
    } finally {
      setBusyDocumentId("");
    }
  }

  async function deleteDocument(document: DocumentWithUploader) {
    if (!window.confirm(`Delete “${document.file_name}” from this workspace?`)) {
      return;
    }
    setBusyDocumentId(document.id);
    setOperationError(null);
    try {
      const client = createClient();
      const { error: storageError } = await client.storage
        .from("workspace-documents")
        .remove([document.storage_path]);
      if (storageError) throw storageError;
      const { error: rowError } = await client
        .from("documents")
        .delete()
        .eq("id", document.id)
        .eq("workspace_id", document.workspace_id);
      if (rowError) throw rowError;
      await refreshDocuments();
    } catch (deleteError) {
      setOperationError({
        workspaceId: document.workspace_id,
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "The document could not be deleted.",
      });
    } finally {
      setBusyDocumentId("");
    }
  }

  if (!isHydrated || !activeWorkspace) {
    return (
      <Card aria-busy="true" className="p-6 text-sm text-muted-foreground" role="status">
        Loading workspace documents…
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="mb-3" variant="secondary">
            <FolderOpen aria-hidden="true" size={13} />
            Private workspace storage
          </Badge>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.8rem]">
            Documents
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Share company files privately with members of {activeWorkspace.name}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="document-project">
            Associate document with a project
          </label>
          <select
            className="min-h-10 rounded-control border border-border bg-surface px-3 text-xs text-foreground"
            id="document-project"
            onChange={(event) => setProjectId(event.target.value)}
            value={validProjectId}
          >
            <option value="">Workspace document</option>
            {projects.filter((project) => !project.archived).map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">
            {uploading ? (
              <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={16} />
            ) : (
              <Upload aria-hidden="true" size={16} />
            )}
            {uploading ? "Uploading…" : "Upload file"}
            <input
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.pptx"
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
              type="file"
            />
          </label>
        </div>
      </header>

      <DemoPersistenceNotice />
      {visibleError && (
        <p className="rounded-control bg-danger-muted px-3 py-2.5 text-xs text-danger" role="alert">
          {visibleError}
        </p>
      )}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Workspace files</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Files are private and access is checked against workspace membership.
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading files…</div>
        ) : documents.length ? (
          <ul className="divide-y divide-border">
            {documents.map((document) => (
              <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
                    <FileText aria-hidden="true" size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{document.file_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatSize(document.size_bytes)} · {document.content_type || "File"} · Uploaded by {document.uploaderName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    disabled={busyDocumentId === document.id}
                    onClick={() => void downloadDocument(document)}
                    size="sm"
                    variant="secondary"
                  >
                    <Download aria-hidden="true" size={14} />
                    Download
                  </Button>
                  <Button
                    aria-label={`Delete ${document.file_name}`}
                    disabled={busyDocumentId === document.id}
                    onClick={() => void deleteDocument(document)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <FileText aria-hidden="true" className="mx-auto text-muted-foreground" size={24} />
            <p className="mt-3 text-sm font-semibold text-foreground">No documents yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a project brief, report, or other company file.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

async function loadWorkspaceDocuments(workspaceId: string) {
  const client = createClient();
  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const uploaderIds = [...new Set((data ?? []).map((document) => document.uploader_id))];
  const profilesResult = uploaderIds.length
    ? await client.from("profiles").select("id, full_name").in("id", uploaderIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;

  const profiles = new Map(
    profilesResult.data.map((profile) => [profile.id, profile.full_name]),
  );
  return (data ?? []).map((document) => ({
    ...document,
    uploaderName: profiles.get(document.uploader_id) || "Team member",
  }));
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
