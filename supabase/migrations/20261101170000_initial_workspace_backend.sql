create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_workspace_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.workspace_id is distinct from new.workspace_id then
    raise exception 'workspace_id cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_workspace_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.owner_id is distinct from new.owner_id then
    raise exception 'workspace ownership changes require an authorized transfer flow'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  description text not null default '',
  industry text not null default '',
  website text not null default '',
  company_size text not null default '',
  time_zone text not null default 'UTC',
  logo_path text not null default '',
  color text not null default 'bg-primary',
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create trigger workspaces_prevent_owner_change
  before update on public.workspaces
  for each row execute function public.prevent_workspace_owner_change();

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'project_manager', 'member', 'guest')),
  department text not null default '',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspaces
  add constraint workspaces_owner_membership_fkey
  foreign key (id, owner_id)
  references public.workspace_members(workspace_id, user_id)
  deferrable initially deferred;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (email = lower(trim(email))),
  full_name text not null default '',
  department text not null default '',
  role text not null check (role in ('admin', 'project_manager', 'member', 'guest')),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index workspace_invitations_pending_email_key
  on public.workspace_invitations (workspace_id, email)
  where status = 'pending';

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'Other',
  status text not null default 'Planning'
    check (status in ('Planning', 'Active', 'On Hold', 'Completed')),
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  start_date date not null default current_date,
  due_date date not null,
  manager_id uuid,
  color text not null default 'violet'
    check (color in ('violet', 'indigo', 'blue', 'emerald', 'amber', 'rose')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, manager_id)
    references public.workspace_members(workspace_id, user_id)
    on delete set null (manager_id),
  check (due_date >= start_date)
);

create table public.project_members (
  workspace_id uuid not null,
  project_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, project_id, user_id),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade,
  foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  title text not null,
  description text not null default '',
  assignee_id uuid,
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status text not null default 'To Do'
    check (status in ('To Do', 'In Progress', 'In Review', 'Done')),
  start_date date,
  due_date date,
  estimated_hours numeric(8, 2) not null default 0 check (estimated_hours >= 0),
  labels text[] not null default '{}'
    check (labels <@ array['Bug', 'Feature', 'Improvement', 'Research', 'Design']::text[]),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade,
  foreign key (workspace_id, assignee_id)
    references public.workspace_members(workspace_id, user_id)
    on delete set null (assignee_id),
  check (due_date is null or start_date is null or due_date >= start_date)
);

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  task_id uuid not null,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, task_id)
    references public.tasks(workspace_id, id) on delete cascade
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  task_id uuid not null,
  text text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, task_id)
    references public.tasks(workspace_id, id) on delete cascade
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  task_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, task_id)
    references public.tasks(workspace_id, id) on delete cascade
);

create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete cascade
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  priority text not null default 'Normal'
    check (priority in ('Normal', 'Important', 'Urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null,
  entity_type text not null
    check (entity_type in ('workspace', 'project', 'task', 'comment', 'announcement', 'calendar_event', 'document', 'member')),
  entity_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  notification_type text not null
    check (notification_type in ('Task assigned', 'Task deadline approaching', 'Task completed', 'Mention received', 'New comment', 'Project update', 'Team announcement', 'Team member invited')),
  title text not null,
  description text not null default '',
  href text not null default '/dashboard',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id) on delete cascade
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  description text not null default '',
  event_type text not null check (event_type in ('Meeting', 'General')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  project_id uuid,
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete set null (project_id),
  check (ends_at > starts_at)
);

create table public.calendar_event_attendees (
  workspace_id uuid not null,
  event_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, event_id, user_id),
  foreign key (workspace_id, event_id)
    references public.calendar_events(workspace_id, id) on delete cascade,
  foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id) on delete cascade
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid,
  uploader_id uuid not null,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, project_id)
    references public.projects(workspace_id, id) on delete set null (project_id),
  foreign key (workspace_id, uploader_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create index workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index invitations_workspace_status_idx on public.workspace_invitations(workspace_id, status);
create index projects_workspace_due_idx on public.projects(workspace_id, due_date);
create index projects_manager_idx on public.projects(workspace_id, manager_id);
create index project_members_user_idx on public.project_members(workspace_id, user_id, project_id);
create index tasks_project_status_idx on public.tasks(workspace_id, project_id, status);
create index tasks_assignee_due_idx on public.tasks(workspace_id, assignee_id, due_date);
create index task_comments_task_created_idx on public.task_comments(workspace_id, task_id, created_at);
create index project_comments_project_created_idx on public.project_comments(workspace_id, project_id, created_at);
create index announcements_workspace_created_idx on public.announcements(workspace_id, created_at desc);
create index activity_events_workspace_created_idx on public.activity_events(workspace_id, created_at desc);
create index activity_events_entity_idx on public.activity_events(workspace_id, entity_type, entity_id);
create index notifications_user_read_created_idx on public.notifications(workspace_id, user_id, read_at, created_at desc);
create index calendar_events_workspace_start_idx on public.calendar_events(workspace_id, starts_at);
create index calendar_attendees_user_idx on public.calendar_event_attendees(workspace_id, user_id, event_id);
create index documents_workspace_project_idx on public.documents(workspace_id, project_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'workspaces', 'workspace_invitations', 'projects', 'tasks',
    'task_subtasks', 'task_checklist_items', 'task_comments',
    'project_comments', 'announcements', 'calendar_events', 'documents'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'workspace_members', 'workspace_invitations', 'projects',
    'project_members', 'tasks', 'task_subtasks',
    'task_checklist_items', 'task_comments', 'project_comments',
    'announcements', 'activity_events', 'notifications',
    'calendar_events', 'calendar_event_attendees', 'documents'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.prevent_workspace_change()',
      table_name || '_prevent_workspace_change',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  full_name_value text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  company_name_value text := coalesce(new.raw_user_meta_data ->> 'company_name', '');
  workspace_name_value text := coalesce(new.raw_user_meta_data ->> 'workspace_name', '');
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, full_name_value, lower(coalesce(new.email, '')))
  on conflict (id) do update
    set full_name = case
      when public.profiles.full_name = '' then excluded.full_name
      else public.profiles.full_name
    end,
    email = excluded.email;

  if length(trim(company_name_value)) > 0
    and length(trim(workspace_name_value)) > 0
    and not exists (
      select 1 from public.workspace_members as membership
      where membership.user_id = new.id and membership.role = 'owner'
    )
    and not exists (
      select 1 from public.workspace_invitations as invitation
      where invitation.email = lower(coalesce(new.email, ''))
        and invitation.status = 'pending'
    )
  then
    insert into public.workspaces (
      name, company_name, owner_id
    )
    values (
      trim(workspace_name_value), trim(company_name_value), new.id
    )
    returning id into new_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, new.id, 'owner');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.workspace_members as wm
    where wm.workspace_id = target_workspace_id and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.workspace_members as wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = any (allowed_roles)
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.workspaces as w
    where w.id = target_workspace_id and w.owner_id = (select auth.uid())
  ) and public.has_workspace_role(target_workspace_id, array['owner']);
$$;

create or replace function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_members as target_membership
      join public.workspace_members as viewer_membership
        on viewer_membership.workspace_id = target_membership.workspace_id
      where target_membership.user_id = target_user_id
        and viewer_membership.user_id = (select auth.uid())
    );
$$;

create or replace function public.can_access_project(
  target_workspace_id uuid,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select public.has_workspace_role(
      target_workspace_id,
      array['owner', 'admin', 'project_manager']
    )
    or exists (
      select 1 from public.project_members as pm
      where pm.workspace_id = target_workspace_id
        and pm.project_id = target_project_id
        and pm.user_id = (select auth.uid())
    );
$$;

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

create or replace function public.can_read_project(
    target_workspace_id uuid,
    target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select public.can_access_project(target_workspace_id, target_project_id)
    or exists (
      select 1 from public.tasks as t
      where t.workspace_id = target_workspace_id
        and t.project_id = target_project_id
        and t.assignee_id = (select auth.uid())
        and public.has_workspace_role(target_workspace_id, array['member'])
    );
$$;

create or replace function public.can_access_task(
  target_workspace_id uuid,
  target_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.tasks as t
    where t.workspace_id = target_workspace_id
      and t.id = target_task_id
      and (
        public.has_workspace_role(
          target_workspace_id,
          array['owner', 'admin', 'project_manager']
        )
        or (
          public.has_workspace_role(target_workspace_id, array['member'])
          and (
            t.assignee_id = (select auth.uid())
            or public.can_access_project(t.workspace_id, t.project_id)
          )
        )
      )
  );
$$;

create or replace function public.can_manage_task(
  target_workspace_id uuid,
  target_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select public.has_workspace_role(
      target_workspace_id,
      array['owner', 'admin', 'project_manager']
    )
    or exists (
      select 1 from public.tasks as t
      where t.workspace_id = target_workspace_id
        and t.id = target_task_id
        and t.assignee_id = (select auth.uid())
        and public.has_workspace_role(target_workspace_id, array['member'])
    );
$$;

create or replace function public.can_view_document(
  target_workspace_id uuid,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select case
    when target_project_id is null
      then public.is_workspace_member(target_workspace_id)
    else public.can_access_project(target_workspace_id, target_project_id)
  end;
$$;

create or replace function public.can_view_activity_event(
  target_workspace_id uuid,
  target_entity_type text,
  target_entity_id uuid,
  target_payload jsonb
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select case
    when target_entity_type in ('workspace', 'member', 'announcement', 'calendar_event')
      then public.is_workspace_member(target_workspace_id)
    when target_entity_type = 'project'
      then public.can_access_project(target_workspace_id, target_entity_id)
    when target_entity_type = 'task'
      then exists (
        select 1 from public.tasks t
        where t.workspace_id = target_workspace_id
          and t.id = target_entity_id
          and public.can_access_task(t.workspace_id, t.id)
      )
    when target_entity_type = 'comment'
      then case target_payload ->> 'related_entity_type'
        when 'project' then exists (
          select 1 from public.projects p
          where p.workspace_id = target_workspace_id
            and p.id::text = (target_payload ->> 'related_entity_id')
            and public.can_access_project(p.workspace_id, p.id)
        )
        when 'task' then exists (
          select 1
          from public.tasks t
          where t.workspace_id = target_workspace_id
            and t.id::text = (target_payload ->> 'related_entity_id')
            and public.can_access_task(t.workspace_id, t.id)
        )
        else false
      end
    when target_entity_type = 'document'
      then public.can_view_document(target_workspace_id, null)
    else false
  end;
$$;

create or replace function public.workspace_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  workspace_folder text := (storage.foldername(object_name))[1];
begin
  if workspace_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return workspace_folder::uuid;
  end if;
  return null;
end;
$$;

create or replace function public.project_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  project_folder text := (storage.foldername(object_name))[3];
begin
  if project_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return project_folder::uuid;
  end if;
  return null;
end;
$$;

create or replace function public.can_access_document_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.documents d
    where d.storage_path = object_name
      and public.can_view_document(d.workspace_id, d.project_id)
  ) or exists (
    select 1
    from public.workspaces w
    where w.logo_path = object_name
      and public.is_workspace_member(w.id)
  );
$$;

create or replace function public.accept_workspace_invitation(invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  invitation public.workspace_invitations%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select lower(u.email) into user_email
  from auth.users as u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null;
  if user_email is null then
    raise exception 'A verified email address is required to accept an invitation'
      using errcode = '42501';
  end if;
  select * into invitation
  from public.workspace_invitations as wi
  where wi.id = invitation_id
    and wi.status = 'pending'
    and wi.email = user_email
  for update;
  if not found then
    return false;
  end if;
  insert into public.workspace_members (workspace_id, user_id, role, department)
  values (
    invitation.workspace_id,
    auth.uid(),
    invitation.role,
    invitation.department
  )
  on conflict (workspace_id, user_id) do nothing;
  update public.workspace_invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation.id;
  return true;
end;
$$;

create or replace function public.list_my_pending_invitations()
returns table (
  id uuid,
  workspace_id uuid,
  email text,
  full_name text,
  department text,
  role text,
  created_at timestamptz,
  workspace_name text,
  company_name text
)
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select
    invitation.id,
    invitation.workspace_id,
    invitation.email,
    invitation.full_name,
    invitation.department,
    invitation.role,
    invitation.created_at,
    workspace.name,
    workspace.company_name
  from public.workspace_invitations as invitation
  join public.workspaces as workspace
    on workspace.id = invitation.workspace_id
  where auth.uid() is not null
    and invitation.status = 'pending'
    and invitation.email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, text[]) from public;
revoke all on function public.is_workspace_owner(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.can_access_project(uuid, uuid) from public;
revoke all on function public.can_create_task(uuid, uuid, uuid) from public;
revoke all on function public.can_read_project(uuid, uuid) from public;
revoke all on function public.can_access_task(uuid, uuid) from public;
revoke all on function public.can_manage_task(uuid, uuid) from public;
revoke all on function public.can_view_document(uuid, uuid) from public;
revoke all on function public.can_view_activity_event(uuid, text, uuid, jsonb) from public;
revoke all on function public.workspace_id_from_storage_path(text) from public;
revoke all on function public.project_id_from_storage_path(text) from public;
revoke all on function public.can_access_document_object(text) from public;
revoke all on function public.accept_workspace_invitation(uuid) from public;
revoke all on function public.list_my_pending_invitations() from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.can_access_project(uuid, uuid) to authenticated;
grant execute on function public.can_create_task(uuid, uuid, uuid) to authenticated;
grant execute on function public.can_read_project(uuid, uuid) to authenticated;
grant execute on function public.can_access_task(uuid, uuid) to authenticated;
grant execute on function public.can_manage_task(uuid, uuid) to authenticated;
grant execute on function public.can_view_document(uuid, uuid) to authenticated;
grant execute on function public.can_view_activity_event(uuid, text, uuid, jsonb) to authenticated;
grant execute on function public.workspace_id_from_storage_path(text) to authenticated;
grant execute on function public.project_id_from_storage_path(text) to authenticated;
grant execute on function public.can_access_document_object(text) to authenticated;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;
grant execute on function public.list_my_pending_invitations() to authenticated;

create or replace function public.create_workspace(
  workspace_name text,
  company_name text,
  description text default '',
  industry text default '',
  website text default '',
  company_size text default '',
  time_zone text default 'UTC'
)
returns uuid
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  new_workspace_id uuid;
  current_user_id uuid := auth.uid();
begin
  if nullif(trim(workspace_name), '') is null
    or nullif(trim(company_name), '') is null
  then
    raise exception 'Company and workspace names are required'
      using errcode = '22023';
  end if;

  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  insert into public.workspaces (
    name, company_name, description, industry, website, company_size,
    time_zone, owner_id
  )
  values (
    trim(workspace_name), trim(company_name), coalesce(description, ''),
    coalesce(industry, ''), coalesce(website, ''),
    coalesce(company_size, ''), coalesce(time_zone, 'UTC'), current_user_id
  )
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, current_user_id, 'owner');
  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text, text, text, text, text, text, text) from public;
grant execute on function public.create_workspace(text, text, text, text, text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_comments enable row level security;
alter table public.project_comments enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_event_attendees enable row level security;
alter table public.documents enable row level security;

create policy "Profiles are visible to self and shared workspace members"
  on public.profiles for select to authenticated
  using ((select public.can_view_profile(id)));
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Members read their workspaces"
  on public.workspaces for select to authenticated
  using (
    (select public.is_workspace_member(id))
    or exists (
      select 1 from public.workspace_invitations as invitation
      where invitation.workspace_id = workspaces.id
        and invitation.status = 'pending'
        and invitation.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
create policy "Owners and admins update workspace settings"
  on public.workspaces for update to authenticated
  using ((select public.has_workspace_role(id, array['owner', 'admin'])))
  with check ((select public.has_workspace_role(id, array['owner', 'admin'])));
create policy "Only the owner deletes a workspace"
  on public.workspaces for delete to authenticated
  using ((select public.is_workspace_owner(id)));

create policy "Workspace members read membership"
  on public.workspace_members for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
create policy "Admins add workspace members"
  on public.workspace_members for insert to authenticated
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    and role <> 'owner'
  );
create policy "Admins update workspace roles"
  on public.workspace_members for update to authenticated
  using (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    and user_id <> (select w.owner_id from public.workspaces w where w.id = workspace_id)
  )
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    and user_id <> (select w.owner_id from public.workspaces w where w.id = workspace_id)
    and role <> 'owner'
  );
create policy "Admins remove members but not the owner"
  on public.workspace_members for delete to authenticated
  using (
    user_id <> (select w.owner_id from public.workspaces w where w.id = workspace_id)
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
  );

create policy "Invited users and workspace admins read invitations"
  on public.workspace_invitations for select to authenticated
  using (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    or (
      status = 'pending'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
create policy "Admins create invitations"
  on public.workspace_invitations for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and role <> 'owner'
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
  );
create policy "Admins update invitations"
  on public.workspace_invitations for update to authenticated
  using ((select public.has_workspace_role(workspace_id, array['owner', 'admin'])))
  with check (
    role <> 'owner'
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
  );
create policy "Admins revoke invitations"
  on public.workspace_invitations for delete to authenticated
  using ((select public.has_workspace_role(workspace_id, array['owner', 'admin'])));

create policy "Users read projects they can access"
  on public.projects for select to authenticated
  using ((select public.can_read_project(workspace_id, id)));
create policy "Admins and project managers create projects"
  on public.projects for insert to authenticated
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
  );
create policy "Admins and project managers update projects"
  on public.projects for update to authenticated
  using ((select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager'])))
  with check ((select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager'])));
create policy "Owners admins and project managers delete projects"
  on public.projects for delete to authenticated
  using ((select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager'])));

create policy "Project access members read assignments"
  on public.project_members for select to authenticated
  using ((select public.can_access_project(workspace_id, project_id)));
create policy "Managers assign project members"
  on public.project_members for insert to authenticated
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
  );
create policy "Managers remove project members"
  on public.project_members for delete to authenticated
  using (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
  );

create policy "Members read permitted tasks"
  on public.tasks for select to authenticated
  using ((select public.can_access_task(workspace_id, id)));
create policy "Managers and assignees create tasks"
  on public.tasks for insert to authenticated
  with check ((select public.can_create_task(workspace_id, project_id, assignee_id)));
create policy "Managers and assigned members update tasks"
  on public.tasks for update to authenticated
  using ((select public.can_manage_task(workspace_id, id)))
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    or (
      assignee_id = (select auth.uid())
      and (select public.has_workspace_role(workspace_id, array['member']))
      and (select public.can_read_project(workspace_id, project_id))
    )
  );
create policy "Managers delete tasks"
  on public.tasks for delete to authenticated
  using ((select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager'])));

create policy "Task participants read subtasks"
  on public.task_subtasks for select to authenticated
  using ((select public.can_manage_task(workspace_id, task_id)) or exists (
    select 1 from public.tasks t
    where t.workspace_id = task_subtasks.workspace_id
      and t.id = task_subtasks.task_id
      and (select public.can_access_project(t.workspace_id, t.project_id))
  ));
create policy "Task managers and assignees add subtasks"
  on public.task_subtasks for insert to authenticated
  with check ((select public.can_manage_task(workspace_id, task_id)));
create policy "Task managers and assignees update subtasks"
  on public.task_subtasks for update to authenticated
  using ((select public.can_manage_task(workspace_id, task_id)))
  with check ((select public.can_manage_task(workspace_id, task_id)));
create policy "Task managers and assignees delete subtasks"
  on public.task_subtasks for delete to authenticated
  using ((select public.can_manage_task(workspace_id, task_id)));

create policy "Task participants read checklist items"
  on public.task_checklist_items for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.workspace_id = task_checklist_items.workspace_id
      and t.id = task_checklist_items.task_id
      and (select public.can_access_task(t.workspace_id, t.id))
  ));
create policy "Task managers and assignees add checklist items"
  on public.task_checklist_items for insert to authenticated
  with check ((select public.can_manage_task(workspace_id, task_id)));
create policy "Task managers and assignees update checklist items"
  on public.task_checklist_items for update to authenticated
  using ((select public.can_manage_task(workspace_id, task_id)))
  with check ((select public.can_manage_task(workspace_id, task_id)));
create policy "Task managers and assignees delete checklist items"
  on public.task_checklist_items for delete to authenticated
  using ((select public.can_manage_task(workspace_id, task_id)));

create policy "Task participants read task comments"
  on public.task_comments for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.workspace_id = task_comments.workspace_id
      and t.id = task_comments.task_id
      and (select public.can_access_task(t.workspace_id, t.id))
  ));
create policy "Members comment on permitted tasks"
  on public.task_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and exists (
      select 1 from public.tasks t
      where t.workspace_id = task_comments.workspace_id
        and t.id = task_comments.task_id
        and (select public.can_access_task(t.workspace_id, t.id))
    )
  );
create policy "Authors and managers edit task comments"
  on public.task_comments for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and exists (
      select 1 from public.tasks t
      where t.workspace_id = task_comments.workspace_id
        and t.id = task_comments.task_id
        and (select public.can_access_task(t.workspace_id, t.id))
    )
  )
  with check (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and exists (
      select 1 from public.tasks t
      where t.workspace_id = task_comments.workspace_id
        and t.id = task_comments.task_id
        and (select public.can_access_task(t.workspace_id, t.id))
    )
  );
create policy "Authors and managers delete task comments"
  on public.task_comments for delete to authenticated
  using (
    (
      author_id = (select auth.uid())
      and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
      and exists (
        select 1 from public.tasks t
        where t.workspace_id = task_comments.workspace_id
          and t.id = task_comments.task_id
          and (select public.can_access_task(t.workspace_id, t.id))
      )
    )
    or (
      (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
      and exists (
        select 1 from public.tasks t
        where t.workspace_id = task_comments.workspace_id
          and t.id = task_comments.task_id
          and (select public.can_access_project(t.workspace_id, t.project_id))
      )
    )
  );

create policy "Project participants read project comments"
  on public.project_comments for select to authenticated
  using ((select public.can_access_project(workspace_id, project_id)));
create policy "Members comment on permitted projects"
  on public.project_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and (select public.can_access_project(workspace_id, project_id))
  );
create policy "Authors and managers edit project comments"
  on public.project_comments for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and (select public.can_access_project(workspace_id, project_id))
  )
  with check (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and (select public.can_access_project(workspace_id, project_id))
  );
create policy "Authors and managers delete project comments"
  on public.project_comments for delete to authenticated
  using (
    (
      author_id = (select auth.uid())
      and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
      and (select public.can_access_project(workspace_id, project_id))
    )
    or (
      (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
      and (select public.can_access_project(workspace_id, project_id))
    )
  );

create policy "Workspace members read announcements"
  on public.announcements for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
create policy "Owners admins and project managers post announcements"
  on public.announcements for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
  );
create policy "Authors and workspace managers edit announcements"
  on public.announcements for update to authenticated
  using (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    and (
      author_id = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    )
  )
  with check (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    and (
      author_id = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    )
  );
create policy "Authors and workspace managers delete announcements"
  on public.announcements for delete to authenticated
  using (
    (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    and (
      author_id = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin']))
    )
  );

create policy "Workspace members read activity"
  on public.activity_events for select to authenticated
  using ((select public.can_view_activity_event(
    workspace_id,
    entity_type,
    entity_id,
    payload
  )));
create policy "Users read own workspace notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_workspace_member(workspace_id)));
create policy "Users update own workspace notifications"
  on public.notifications for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.is_workspace_member(workspace_id))
  )
  with check (
    user_id = (select auth.uid())
    and (select public.is_workspace_member(workspace_id))
  );
create policy "Users delete own workspace notifications"
  on public.notifications for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.is_workspace_member(workspace_id))
  );

create policy "Workspace members read calendar events"
  on public.calendar_events for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
create policy "Members create calendar events"
  on public.calendar_events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
  );
create policy "Authors admins and project managers update calendar events"
  on public.calendar_events for update to authenticated
  using (
    (select public.is_workspace_member(workspace_id))
    and (
      created_by = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    )
  )
  with check (
    (select public.is_workspace_member(workspace_id))
    and (
      created_by = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    )
  );
create policy "Authors admins and project managers delete calendar events"
  on public.calendar_events for delete to authenticated
  using (
    (select public.is_workspace_member(workspace_id))
    and (
      created_by = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    )
  );

create policy "Workspace members read calendar attendees"
  on public.calendar_event_attendees for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
create policy "Event managers update attendees"
  on public.calendar_event_attendees for insert to authenticated
  with check (
    (select public.is_workspace_member(workspace_id))
    and (
      (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
      or exists (
        select 1 from public.calendar_events e
        where e.workspace_id = calendar_event_attendees.workspace_id
          and e.id = calendar_event_attendees.event_id
          and e.created_by = (select auth.uid())
      )
    )
  );
create policy "Event managers remove attendees"
  on public.calendar_event_attendees for delete to authenticated
  using (
    (select public.is_workspace_member(workspace_id))
    and (
      (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
      or exists (
        select 1 from public.calendar_events e
        where e.workspace_id = calendar_event_attendees.workspace_id
          and e.id = calendar_event_attendees.event_id
          and e.created_by = (select auth.uid())
      )
    )
  );

create policy "Users read permitted documents"
  on public.documents for select to authenticated
  using ((select public.can_view_document(workspace_id, project_id)));
create policy "Members upload permitted documents"
  on public.documents for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager', 'member']))
    and (select public.can_view_document(workspace_id, project_id))
  );
create policy "Uploader and managers delete documents"
  on public.documents for delete to authenticated
  using (
    (select public.can_view_document(workspace_id, project_id))
    and (
      uploader_id = (select auth.uid())
      or (select public.has_workspace_role(workspace_id, array['owner', 'admin', 'project_manager']))
    )
  );

create or replace function public.record_project_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  action_text text;
begin
  action_text := case
    when tg_op = 'INSERT' then 'created the project'
    else 'updated project details'
  end;
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.workspace_id,
    auth.uid(),
    case when tg_op = 'INSERT' then 'project_created' else 'project_updated' end,
    'project',
    new.id,
    jsonb_build_object('action', action_text, 'title', new.name)
  );
  if tg_op = 'UPDATE' then
    insert into public.notifications (
      workspace_id, user_id, notification_type, title, description, href
    )
    select
      new.workspace_id,
      pm.user_id,
      'Project update',
      'A project was updated',
      new.name,
      '/projects/' || new.id::text
    from public.project_members pm
    where pm.workspace_id = new.workspace_id
      and pm.project_id = new.id
      and pm.user_id <> coalesce(auth.uid(), new.manager_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger projects_record_activity
  after insert or update on public.projects
  for each row execute function public.record_project_activity();

create or replace function public.record_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  action_text text;
begin
  action_text := case
    when tg_op = 'INSERT' then 'created the task'
    when old.status is distinct from new.status and new.status = 'Done'
      then 'completed the task'
    when old.status is distinct from new.status
      then 'moved the task to ' || new.status
    when old.assignee_id is distinct from new.assignee_id
      then 'updated the task assignee'
    else 'updated the task'
  end;
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.workspace_id,
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'task_created'
      when old.status is distinct from new.status and new.status = 'Done'
        then 'task_completed'
      when old.status is distinct from new.status then 'task_status_changed'
      else 'task_updated'
    end,
    'task',
    new.id,
    jsonb_build_object('action', action_text, 'title', new.title)
  );
  if new.assignee_id is not null
    and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id)
    and new.assignee_id <> coalesce(auth.uid(), new.assignee_id)
  then
    insert into public.notifications (
      workspace_id, user_id, notification_type, title, description, href
    )
    values (
      new.workspace_id,
      new.assignee_id,
      'Task assigned',
      'A task was assigned to you',
      new.title,
      '/tasks/' || new.id::text
    );
  end if;
  if new.assignee_id is not null
    and new.due_date between current_date and current_date + 3
    and (tg_op = 'INSERT' or old.due_date is distinct from new.due_date)
  then
    insert into public.notifications (
      workspace_id, user_id, notification_type, title, description, href
    )
    values (
      new.workspace_id,
      new.assignee_id,
      'Task deadline approaching',
      'A task deadline is approaching',
      new.title,
      '/tasks/' || new.id::text
    );
  end if;
  if tg_op = 'UPDATE'
    and old.status is distinct from new.status
    and new.status = 'Done'
    and new.assignee_id is not null
    and new.assignee_id <> coalesce(auth.uid(), new.assignee_id)
  then
    insert into public.notifications (
      workspace_id, user_id, notification_type, title, description, href
    )
    values (
      new.workspace_id,
      new.assignee_id,
      'Task completed',
      'A task was completed',
      new.title,
      '/tasks/' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger tasks_record_activity
  after insert or update on public.tasks
  for each row execute function public.record_task_activity();

create or replace function public.record_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  related_title text;
  related_entity_id uuid;
  related_entity_type text;
  related_project_id uuid;
  recipient record;
  profile_name text;
begin
  if tg_table_name = 'task_comments' then
    select t.title, t.id, 'task'
      into related_title, related_entity_id, related_entity_type
    from public.tasks t
    where t.workspace_id = new.workspace_id and t.id = new.task_id;
    select t.project_id into related_project_id
    from public.tasks t
    where t.workspace_id = new.workspace_id and t.id = new.task_id;
  else
    select p.name, p.id, 'project'
      into related_title, related_entity_id, related_entity_type
    from public.projects p
    where p.workspace_id = new.workspace_id and p.id = new.project_id;
    related_project_id := new.project_id;
  end if;
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.workspace_id,
    new.author_id,
    'comment_added',
    'comment',
    new.id,
    jsonb_build_object(
      'action', 'added a comment on',
      'title', related_title,
      'related_entity_id', related_entity_id,
      'related_entity_type', related_entity_type
    )
  );
  select p.full_name into profile_name
  from public.profiles p where p.id = new.author_id;

  for recipient in
    select distinct wm.user_id
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id <> new.author_id
      and (
        (select public.has_workspace_role(
          new.workspace_id,
          array['owner', 'admin', 'project_manager']
        ))
        or exists (
          select 1 from public.project_members pm
          where pm.workspace_id = new.workspace_id
            and pm.project_id = related_project_id
            and pm.user_id = wm.user_id
        )
        or exists (
          select 1 from public.projects p
          where p.workspace_id = new.workspace_id
            and p.id = related_project_id
            and p.manager_id = wm.user_id
        )
        or exists (
          select 1 from public.tasks t
          where related_entity_type = 'task'
            and t.workspace_id = new.workspace_id
            and t.id = related_entity_id
            and t.assignee_id = wm.user_id
        )
      )
  loop
    if coalesce((select p.full_name from public.profiles p where p.id = recipient.user_id), '') <> ''
      and position('@' || (select p.full_name from public.profiles p where p.id = recipient.user_id)
        in new.body) > 0
    then
      insert into public.notifications (
        workspace_id, user_id, notification_type, title, description, href
      )
      values (
        new.workspace_id,
        recipient.user_id,
        'Mention received',
        coalesce(profile_name, 'A teammate') || ' mentioned you',
        related_title,
        case when related_entity_type = 'task'
          then '/tasks/' || related_entity_id::text
          else '/projects/' || related_entity_id::text
        end
      );
    else
      insert into public.notifications (
        workspace_id, user_id, notification_type, title, description, href
      )
      values (
        new.workspace_id,
        recipient.user_id,
        'New comment',
        'A new comment was added',
        related_title,
        case when related_entity_type = 'task'
          then '/tasks/' || related_entity_id::text
          else '/projects/' || related_entity_id::text
        end
      );
    end if;
  end loop;
  return new;
end;
$$;

create trigger task_comments_record_activity
  after insert on public.task_comments
  for each row execute function public.record_comment_activity();
create trigger project_comments_record_activity
  after insert on public.project_comments
  for each row execute function public.record_comment_activity();

create or replace function public.record_task_child_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  child_workspace_id uuid;
  child_task_id uuid;
  child_name text;
  action_text text;
begin
  if tg_op = 'DELETE' then
    child_workspace_id := old.workspace_id;
    child_task_id := old.task_id;
    if tg_table_name = 'task_subtasks' then
      child_name := old.title;
    else
      child_name := old.text;
    end if;
  else
    child_workspace_id := new.workspace_id;
    child_task_id := new.task_id;
    if tg_table_name = 'task_subtasks' then
      child_name := new.title;
    else
      child_name := new.text;
    end if;
  end if;
  if tg_table_name = 'task_subtasks' then
    action_text := case
      when tg_op = 'INSERT' then 'added a subtask'
      when tg_op = 'UPDATE' then 'updated a subtask'
      else 'removed a subtask'
    end;
  else
    action_text := case
      when tg_op = 'INSERT' then 'added a checklist item'
      when tg_op = 'UPDATE' then 'updated a checklist item'
      else 'removed a checklist item'
    end;
  end if;
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    child_workspace_id,
    auth.uid(),
    case when tg_op = 'DELETE' then 'task_detail_removed' else 'task_detail_updated' end,
    'task',
    child_task_id,
    jsonb_build_object('action', action_text, 'title', child_name)
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger task_subtasks_record_activity
  after insert or update or delete on public.task_subtasks
  for each row execute function public.record_task_child_activity();
create trigger task_checklist_record_activity
  after insert or update or delete on public.task_checklist_items
  for each row execute function public.record_task_child_activity();

create or replace function public.record_invitation_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.workspace_id,
    new.invited_by,
    'member_invited',
    'member',
    new.id,
    jsonb_build_object(
      'action', 'invited a teammate',
      'title', coalesce(nullif(trim(new.full_name), ''), 'a new teammate')
    )
  );
  return new;
end;
$$;

create trigger workspace_invitations_record_activity
  after insert on public.workspace_invitations
  for each row execute function public.record_invitation_activity();

create or replace function public.notify_workspace_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  insert into public.notifications (
    workspace_id, user_id, notification_type, title, description, href
  )
  select
    new.workspace_id,
    wm.user_id,
    'Team member invited',
    'A teammate was invited',
    coalesce(nullif(trim(new.full_name), ''), new.email),
    '/settings/members'
  from public.workspace_members wm
  where wm.workspace_id = new.workspace_id
    and wm.role in ('owner', 'admin')
    and wm.user_id <> new.invited_by;
  return new;
end;
$$;

create trigger workspace_invitations_notify_admins
  after insert on public.workspace_invitations
  for each row execute function public.notify_workspace_invitation();

create or replace function public.notify_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  insert into public.activity_events (
    workspace_id, actor_id, event_type, entity_type, entity_id, payload
  )
  values (
    new.workspace_id,
    new.author_id,
    case when tg_op = 'INSERT' then 'announcement_posted' else 'announcement_updated' end,
    'announcement',
    new.id,
    jsonb_build_object(
      'action',
      case when tg_op = 'INSERT' then 'posted an announcement' else 'updated an announcement' end,
      'title',
      new.title
    )
  );
  if tg_op = 'INSERT' then
    insert into public.notifications (
      workspace_id, user_id, notification_type, title, description, href
    )
    select
      new.workspace_id,
      wm.user_id,
      'Team announcement',
      'A new team announcement',
      new.title,
      '/activity'
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id and wm.user_id <> new.author_id;
  end if;
  return new;
end;
$$;

create trigger announcements_notify_members
  after insert or update on public.announcements
  for each row execute function public.notify_announcement();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-documents',
  'workspace-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Workspace users read permitted document files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'workspace-documents'
    and (select public.can_access_document_object(name))
  );
create policy "Workspace members upload private documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'workspace-documents'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (
      (storage.foldername(name))[3] = 'workspace'
      or public.project_id_from_storage_path(name) is not null
    )
    and (select public.has_workspace_role(
      public.workspace_id_from_storage_path(name),
      array['owner', 'admin', 'project_manager', 'member']
    ))
    and (select public.can_view_document(
      public.workspace_id_from_storage_path(name),
      public.project_id_from_storage_path(name)
    ))
  );
create policy "Workspace members delete permitted files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'workspace-documents'
    and (
      (storage.foldername(name))[2] = (select auth.uid())::text
      or (select public.has_workspace_role(
        public.workspace_id_from_storage_path(name),
        array['owner', 'admin', 'project_manager']
      ))
    )
    and (select public.can_access_document_object(name))
  );

grant usage on schema public to authenticated;
revoke all on
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.workspace_invitations,
  public.projects,
  public.project_members,
  public.tasks,
  public.task_subtasks,
  public.task_checklist_items,
  public.task_comments,
  public.project_comments,
  public.announcements,
  public.activity_events,
  public.notifications,
  public.calendar_events,
  public.calendar_event_attendees,
  public.documents
from anon, authenticated;

grant select (id, full_name, avatar_url, created_at, updated_at)
  on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select, delete on public.workspaces to authenticated;
grant update (name, company_name, description, industry, website, company_size, time_zone, logo_path, color)
  on public.workspaces to authenticated;
grant select, insert, delete on public.workspace_members to authenticated;
grant update (role, department) on public.workspace_members to authenticated;
grant select, insert, delete on public.workspace_invitations to authenticated;
grant update (email, full_name, department, role) on public.workspace_invitations to authenticated;
grant select, insert, delete on public.projects to authenticated;
grant update (name, description, category, status, priority, start_date, due_date, manager_id, color, archived)
  on public.projects to authenticated;
grant select, insert, delete on public.project_members to authenticated;
grant select, insert, delete on public.tasks to authenticated;
grant update (project_id, title, description, assignee_id, priority, status, start_date, due_date, estimated_hours, labels)
  on public.tasks to authenticated;
grant select, insert, delete on public.task_subtasks to authenticated;
grant update (title, completed, position) on public.task_subtasks to authenticated;
grant select, insert, delete on public.task_checklist_items to authenticated;
grant update (text, completed, position) on public.task_checklist_items to authenticated;
grant select, insert, delete on public.task_comments to authenticated;
grant update (body) on public.task_comments to authenticated;
grant select, insert, delete on public.project_comments to authenticated;
grant update (body) on public.project_comments to authenticated;
grant select, insert, delete on public.announcements to authenticated;
grant update (title, description, priority) on public.announcements to authenticated;
grant select on public.activity_events to authenticated;
grant select, update (read_at), delete on public.notifications to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant select, insert, delete on public.calendar_events to authenticated;
grant update (title, description, event_type, starts_at, ends_at, project_id, location)
  on public.calendar_events to authenticated;
grant select, insert, delete on public.calendar_event_attendees to authenticated;
