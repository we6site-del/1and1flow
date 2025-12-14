-- Function to safely add credits to a user
CREATE OR REPLACE FUNCTION add_user_credits(user_uuid UUID, amount_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + amount_to_add
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
