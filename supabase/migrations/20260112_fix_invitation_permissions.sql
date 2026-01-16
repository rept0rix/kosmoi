-- Enable Read Access for All Users on 'invitations' table
-- This allows the public 'AdminHyperloop' dashboard to display live agent activity.
alter table "public"."invitations" enable row level security;
create policy "Enable read access for all users" on "public"."invitations" for
select using (true);