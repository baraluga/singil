-- Drop auth.users foreign key on bills since we no longer use Supabase auth.
-- user_id is kept as a plain UUID column for filtering (single creator app).
ALTER TABLE bills DROP CONSTRAINT bills_user_id_fkey;
ALTER TABLE payment_methods DROP CONSTRAINT payment_methods_user_id_fkey;
