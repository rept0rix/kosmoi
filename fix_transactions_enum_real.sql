-- Fix for Enum Type "transaction_type"
-- The error indicates 'type' is a PostgreSQL ENUM, not a Check Constraint.
-- We must add the value to the Enum definition itself.
-- This command adds 'transfer' to the list of valid values for the enum.
ALTER TYPE public.transaction_type
ADD VALUE IF NOT EXISTS 'transfer';