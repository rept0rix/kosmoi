-- Function to handle claim approval and transfer ownership
CREATE OR REPLACE FUNCTION handle_claim_approval() RETURNS TRIGGER AS $$ BEGIN -- Check if status is changed to 'approved'
    IF NEW.status = 'approved'
    AND OLD.status != 'approved' THEN -- Update the business owner
UPDATE service_providers
SET owner_id = NEW.user_id,
    updated_at = NOW()
WHERE id = NEW.business_id;
-- Optional: Log the transfer?
-- INSERT INTO activity_logs ...
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create the trigger
DROP TRIGGER IF EXISTS on_claim_approval ON business_claims;
CREATE TRIGGER on_claim_approval
AFTER
UPDATE OF status ON business_claims FOR EACH ROW EXECUTE FUNCTION handle_claim_approval();