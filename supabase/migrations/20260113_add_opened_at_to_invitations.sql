alter table invitations
add column if not exists opened_at timestamptz;
comment on column invitations.opened_at is 'Timestamp when the invitation email was first opened (Pixel).';