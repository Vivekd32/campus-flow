export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamped = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        created_at: string;
        updated_at: string;
      }>;
      workspaces: Table<
        Timestamped & {
          name: string;
          company_name: string;
          description: string;
          industry: string;
          website: string;
          company_size: string;
          time_zone: string;
          logo_path: string;
          color: string;
          owner_id: string;
        }
      >;
      workspace_members: Table<{
        workspace_id: string;
        user_id: string;
        role: string;
        department: string;
        created_at: string;
      }>;
      workspace_invitations: Table<
        Timestamped & {
          workspace_id: string;
          email: string;
          full_name: string;
          department: string;
          role: string;
          invited_by: string;
          status: string;
          accepted_at: string | null;
        }
      >;
      projects: Table<
        Timestamped & {
          workspace_id: string;
          name: string;
          description: string;
          category: string;
          status: string;
          priority: string;
          start_date: string;
          due_date: string;
          manager_id: string | null;
          color: string;
          archived: boolean;
        }
      >;
      project_members: Table<{
        workspace_id: string;
        project_id: string;
        user_id: string;
        created_at: string;
      }>;
      tasks: Table<
        Timestamped & {
          workspace_id: string;
          project_id: string;
          title: string;
          description: string;
          assignee_id: string | null;
          priority: string;
          status: string;
          start_date: string | null;
          due_date: string | null;
          estimated_hours: number;
          labels: string[];
        }
      >;
      task_subtasks: Table<{
        id: string;
        workspace_id: string;
        task_id: string;
        title: string;
        completed: boolean;
        position: number;
        created_at: string;
        updated_at: string;
      }>;
      task_checklist_items: Table<{
        id: string;
        workspace_id: string;
        task_id: string;
        text: string;
        completed: boolean;
        position: number;
        created_at: string;
        updated_at: string;
      }>;
      task_comments: Table<{
        id: string;
        workspace_id: string;
        task_id: string;
        author_id: string;
        body: string;
        created_at: string;
        updated_at: string;
      }>;
      project_comments: Table<{
        id: string;
        workspace_id: string;
        project_id: string;
        author_id: string;
        body: string;
        created_at: string;
        updated_at: string;
      }>;
      announcements: Table<
        Timestamped & {
          workspace_id: string;
          author_id: string;
          title: string;
          description: string;
          priority: string;
        }
      >;
      activity_events: Table<{
        id: string;
        workspace_id: string;
        actor_id: string;
        event_type: string;
        entity_type: string;
        entity_id: string | null;
        payload: Json;
        created_at: string;
      }>;
      notifications: Table<{
        id: string;
        workspace_id: string;
        user_id: string;
        notification_type: string;
        title: string;
        description: string;
        href: string;
        read_at: string | null;
        created_at: string;
      }>;
      calendar_events: Table<
        Timestamped & {
          workspace_id: string;
          created_by: string;
          title: string;
          description: string;
          event_type: string;
          starts_at: string;
          ends_at: string;
          project_id: string | null;
          location: string;
        }
      >;
      calendar_event_attendees: Table<{
        workspace_id: string;
        event_id: string;
        user_id: string;
        created_at: string;
      }>;
      documents: Table<
        Timestamped & {
          workspace_id: string;
          project_id: string | null;
          uploader_id: string;
          storage_path: string;
          file_name: string;
          content_type: string;
          size_bytes: number;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace: {
        Args: {
          workspace_name: string;
          company_name: string;
          description?: string;
          industry?: string;
          website?: string;
          company_size?: string;
          time_zone?: string;
        };
        Returns: string;
      };
      accept_workspace_invitation: {
        Args: { invitation_id: string };
        Returns: boolean;
      };
      list_my_pending_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          workspace_id: string;
          email: string;
          full_name: string;
          department: string;
          role: string;
          created_at: string;
          workspace_name: string;
          company_name: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
