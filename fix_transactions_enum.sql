-- Fix Transaction Type Constraint
-- Allow 'transfer' as a valid transaction type
-- 1. Drop existing check constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
-- 2. Add new check constraint including 'transfer'
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check CHECK (
        type IN (
            'topup',
            'payment',
            'refund',
            'withdrawal',
            'adjustment',
            'transfer' -- NEW TYPE
        )
    );