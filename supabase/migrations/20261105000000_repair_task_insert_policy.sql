create or replace function public.can_create_task(
  target_workspace_id uuid,
  target_project_id uuid,
  target_assignee_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.workspaces as workspace
    where workspace.id = target_workspace_id
      and (
        workspace.owner_id = (select auth.uid())
        or public.has_workspace_role(
          target_workspace_id,
          array['owner', 'admin', 'project_manager']
        )
        or (
          target_assignee_id = (select auth.uid())
          and public.has_workspace_role(target_workspace_id, array['member'])
          and public.can_access_project(target_workspace_id, target_project_id)
        )
      )
  )
  and exists (
    select 1
    from public.projects as project
    where project.id = target_project_id
      and project.workspace_id = target_workspace_id
  );
$$;

revoke all on function public.can_create_task(uuid, uuid, uuid) from public;
grant execute on function public.can_create_task(uuid, uuid, uuid) to authenticated;

alter table public.tasks enable row level security;

drop policy if exists "Managers and assignees create tasks" on public.tasks;
create policy "Managers and assignees create tasks"
  on public.tasks for insert to authenticated
  with check (
    (select public.can_create_task(workspace_id, project_id, assignee_id))
  );
