begin;

select plan(37);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001', 'authenticated',
    'authenticated', 'owner-a@example.test', 'test-hash', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Owner A","company_name":"Company A","workspace_name":"Workspace A"}',
    now(), now()
  ),
  (
    '20000000-0000-4000-8000-000000000002', 'authenticated',
    'authenticated', 'owner-b@example.test', 'test-hash', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Owner B","company_name":"Company B","workspace_name":"Workspace B"}',
    now(), now()
  ),
  (
    '30000000-0000-4000-8000-000000000003', 'authenticated',
    'authenticated', 'member-a@example.test', 'test-hash', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Member A"}',
    now(), now()
  ),
  (
    '90000000-0000-4000-8000-000000000009', 'authenticated',
    'authenticated', 'admin-b@example.test', 'test-hash', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin B"}',
    now(), now()
  ),
  (
    'a0000000-0000-4000-8000-00000000000a', 'authenticated',
    'authenticated', 'project-manager-b@example.test', 'test-hash', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Project Manager B"}',
    now(), now()
  );

insert into public.workspace_members (workspace_id, user_id, role)
select id, '30000000-0000-4000-8000-000000000003', 'member'
from public.workspaces
where owner_id = '10000000-0000-4000-8000-000000000001';

insert into public.workspace_members (workspace_id, user_id, role)
select id, '90000000-0000-4000-8000-000000000009', 'admin'
from public.workspaces
where owner_id = '20000000-0000-4000-8000-000000000002';

insert into public.workspace_members (workspace_id, user_id, role)
select id, 'a0000000-0000-4000-8000-00000000000a', 'project_manager'
from public.workspaces
where owner_id = '20000000-0000-4000-8000-000000000002';

insert into public.projects (
  id, workspace_id, name, due_date, manager_id
)
select
  '40000000-0000-4000-8000-000000000004',
  id,
  'Project A',
  current_date + 14,
  '10000000-0000-4000-8000-000000000001'
from public.workspaces
where owner_id = '10000000-0000-4000-8000-000000000001';

insert into public.projects (
  id, workspace_id, name, due_date, manager_id
)
select
  '50000000-0000-4000-8000-000000000005',
  id,
  'Project B',
  current_date + 14,
  '20000000-0000-4000-8000-000000000002'
from public.workspaces
where owner_id = '20000000-0000-4000-8000-000000000002';

insert into public.tasks (id, workspace_id, project_id, title, assignee_id)
select
  '60000000-0000-4000-8000-000000000006',
  workspace_id,
  id,
  'Assigned to member',
  '30000000-0000-4000-8000-000000000003'
from public.projects
where id = '40000000-0000-4000-8000-000000000004';

insert into public.tasks (workspace_id, project_id, title)
select workspace_id, id, 'Unassigned sibling task'
from public.projects
where id = '40000000-0000-4000-8000-000000000004';

insert into public.tasks (id, workspace_id, project_id, title)
select
  '70000000-0000-4000-8000-000000000007',
  workspace_id,
  id,
  'Company B task'
from public.projects
where id = '50000000-0000-4000-8000-000000000005';

insert into public.documents (
  workspace_id, project_id, uploader_id, storage_path, file_name,
  content_type, size_bytes
)
select
  p.workspace_id,
  p.id,
  '10000000-0000-4000-8000-000000000001',
  p.workspace_id::text || '/10000000-0000-4000-8000-000000000001/' ||
    p.id::text || '/brief.pdf',
  'brief.pdf',
  'application/pdf',
  1024
from public.projects p
where p.id = '40000000-0000-4000-8000-000000000004';

insert into public.workspace_invitations (
  workspace_id, email, role, invited_by
)
select id, 'invitee-a@example.test', 'member', owner_id
from public.workspaces
where owner_id = '10000000-0000-4000-8000-000000000001';

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '80000000-0000-4000-8000-000000000008', 'authenticated',
  'authenticated', 'invitee-a@example.test', 'test-hash', now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Invitee A","company_name":"Ignored Company","workspace_name":"Ignored Workspace"}',
  now(), now()
);

select set_config(
  'test.workspace_a_id',
  (select workspace_id::text from public.projects where id = '40000000-0000-4000-8000-000000000004'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.email', 'owner-b@example.test', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","email":"owner-b@example.test","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.workspaces),
  1,
  'Company B sees only its own workspace'
);
select is(
  (select count(*)::integer from public.workspaces where owner_id = '10000000-0000-4000-8000-000000000001'),
  0,
  'Company B cannot read Company A workspace'
);
select is(
  (select count(*)::integer from public.projects),
  1,
  'Company B sees only its own project'
);
select is(
  (select count(*)::integer from public.projects where id = '40000000-0000-4000-8000-000000000004'),
  0,
  'Company B cannot read Company A project'
);
select is(
  (select count(*)::integer from public.tasks where id = '60000000-0000-4000-8000-000000000006'),
  0,
  'Company B cannot read Company A task'
);
select is(
  (select count(*)::integer from public.profiles where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'Company B cannot read unrelated company profile'
);
select is(
  (select count(*)::integer from public.documents where file_name = 'brief.pdf'),
  0,
  'Company B cannot read Company A document metadata'
);
select throws_ok(
  $$insert into public.projects (workspace_id, name, due_date)
    values (current_setting('test.workspace_a_id')::uuid, 'Cross-company insert', current_date + 1)$$,
  '42501',
  null,
  'Company B cannot create a project in Company A'
);
select throws_ok(
  $$insert into public.tasks (workspace_id, project_id, title)
    values (
      current_setting('test.workspace_a_id')::uuid,
      '40000000-0000-4000-8000-000000000004',
      'Cross-company task'
    )$$,
  '42501',
  null,
  'Company B cannot create a task in Company A'
);
select lives_ok(
  $$insert into public.tasks (workspace_id, project_id, title)
    select workspace_id, id, 'Owner-created task'
    from public.projects
    where id = '50000000-0000-4000-8000-000000000005'$$,
  'Workspace owner can create a task in their project'
);
select is(
  (select count(*)::integer from public.tasks where title = 'Owner-created task'),
  1,
  'Owner-created task is persisted'
);
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000009', true);
select set_config('request.jwt.claim.email', 'admin-b@example.test', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"90000000-0000-4000-8000-000000000009","email":"admin-b@example.test","role":"authenticated"}',
  true
);
select lives_ok(
  $$insert into public.tasks (workspace_id, project_id, title)
    select workspace_id, id, 'Admin-created task'
    from public.projects
    where id = '50000000-0000-4000-8000-000000000005'$$,
  'Workspace admin can create a task in their project'
);
select is(
  (select count(*)::integer from public.tasks where title = 'Admin-created task'),
  1,
  'Admin-created task is persisted'
);
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-00000000000a', true);
select set_config('request.jwt.claim.email', 'project-manager-b@example.test', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-00000000000a","email":"project-manager-b@example.test","role":"authenticated"}',
  true
);
select lives_ok(
  $$insert into public.tasks (workspace_id, project_id, title)
    select workspace_id, id, 'Project-manager-created task'
    from public.projects
    where id = '50000000-0000-4000-8000-000000000005'$$,
  'Project manager can create a task in their project'
);
select is(
  (select count(*)::integer from public.tasks where title = 'Project-manager-created task'),
  1,
  'Project-manager-created task is persisted'
);
select ok(
  not has_table_privilege('authenticated', 'public.activity_events', 'INSERT'),
  'Authenticated users cannot forge activity events'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'email', 'SELECT'),
  'Workspace members cannot read private profile email addresses'
);
select ok(
  not has_table_privilege('anon', 'public.workspaces', 'SELECT')
    and not has_table_privilege('anon', 'public.projects', 'SELECT')
    and not has_table_privilege('anon', 'public.tasks', 'SELECT'),
  'Unauthenticated role has no direct access to private application tables'
);
select ok(
  not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any (array[
        'profiles', 'workspaces', 'workspace_members', 'workspace_invitations',
        'projects', 'project_members', 'tasks', 'task_subtasks',
        'task_checklist_items', 'task_comments', 'project_comments',
        'announcements', 'activity_events', 'notifications',
        'calendar_events', 'calendar_event_attendees', 'documents'
      ])
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  'Every exposed application table has row-level security enabled'
);
select ok(
  not public.can_access_document_object(
    (select storage_path from public.documents where file_name = 'brief.pdf')
  ),
  'Company B cannot access Company A private document object'
);
select is(
  public.accept_workspace_invitation(
    (select id from public.workspace_invitations where email = 'invitee-a@example.test')
  ),
  false,
  'An unrelated company account cannot accept another email address invitation'
);

select set_config('request.jwt.claim.sub', '80000000-0000-4000-8000-000000000008', true);
select set_config('request.jwt.claim.email', 'invitee-a@example.test', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"80000000-0000-4000-8000-000000000008","email":"invitee-a@example.test","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.workspace_invitations where email = 'invitee-a@example.test'),
  1,
  'Invitee can read their own pending invitation'
);
select is(
  (select workspace_name from public.list_my_pending_invitations() where email = 'invitee-a@example.test'),
  'Workspace A',
  'Invitee can see invited workspace details through the scoped function'
);
select is(
  (select count(*)::integer from public.workspaces where owner_id = '10000000-0000-4000-8000-000000000001'),
  0,
  'Invitee cannot read a workspace directly before joining'
);
select is(
  (select count(*)::integer from public.workspaces where owner_id = '80000000-0000-4000-8000-000000000008'),
  0,
  'Invitation signup does not create an unrelated workspace'
);
select is(
  public.accept_workspace_invitation(
    (select id from public.workspace_invitations where email = 'invitee-a@example.test')
  ),
  true,
  'Verified invitee can accept the invitation'
);
select is(
  (select count(*)::integer from public.workspace_members where user_id = '80000000-0000-4000-8000-000000000008' and role = 'member'),
  1,
  'Acceptance creates the invited workspace membership'
);
select is(
  (select count(*)::integer from public.workspaces where owner_id = '10000000-0000-4000-8000-000000000001'),
  1,
  'Invitee can read the workspace after acceptance'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.email', 'member-a@example.test', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","email":"member-a@example.test","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.projects where id = '40000000-0000-4000-8000-000000000004'),
  1,
  'Assigned member can access the task project'
);
select is(
  (select count(*)::integer from public.tasks where id = '60000000-0000-4000-8000-000000000006'),
  1,
  'Assigned member can read assigned task without project membership'
);
select is(
  (select count(*)::integer from public.tasks),
  1,
  'Assigned member cannot read unrelated tasks in the same project'
);
update public.tasks
set title = 'Member update'
where id = '60000000-0000-4000-8000-000000000006';
select is(
  (select title from public.tasks where id = '60000000-0000-4000-8000-000000000006'),
  'Member update',
  'Member can update their assigned task'
);
select throws_ok(
  $$update public.tasks
    set workspace_id = (select id from public.workspaces where owner_id = '20000000-0000-4000-8000-000000000002')
    where id = '60000000-0000-4000-8000-000000000006'$$,
  '42501',
  null,
  'Task workspace_id cannot be changed to another tenant'
);
update public.workspace_members
set role = 'owner'
where user_id = '30000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::integer from public.workspace_members where user_id = '30000000-0000-4000-8000-000000000003' and role = 'member'),
  1,
  'Member cannot grant themselves owner role'
);
update public.tasks
set title = 'Unauthorized change'
where id = '70000000-0000-4000-8000-000000000007';
select is(
  (select count(*)::integer from public.tasks where id = '70000000-0000-4000-8000-000000000007'),
  0,
  'Member cannot read or modify another company task'
);

reset role;
update public.workspace_members
set role = 'guest'
where user_id = '30000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","email":"member-a@example.test","role":"authenticated"}',
  true
);
update public.tasks
set title = 'Guest edit'
where id = '60000000-0000-4000-8000-000000000006';
select is(
  (select title from public.tasks where id = '60000000-0000-4000-8000-000000000006'),
  'Member update',
  'Guest cannot modify assigned work'
);
update public.workspaces
set name = 'Guest workspace takeover'
where owner_id = '10000000-0000-4000-8000-000000000001';
select is(
  (select name from public.workspaces where owner_id = '10000000-0000-4000-8000-000000000001'),
  'Workspace A',
  'Guest cannot perform workspace administration'
);

select * from finish();
rollback;
