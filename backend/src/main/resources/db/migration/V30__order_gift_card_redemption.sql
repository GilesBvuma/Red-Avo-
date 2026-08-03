ALTER TABLE orders ADD COLUMN gift_card_code_redeemed VARCHAR(255);
ALTER TABLE orders ADD COLUMN gift_card_amount_redeemed DOUBLE PRECISION DEFAULT 0.0;
