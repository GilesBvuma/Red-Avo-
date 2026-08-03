CREATE TABLE order_gift_cards (
    id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    tier_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    purchaser_name VARCHAR(255),
    purchaser_email VARCHAR(255),
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    personal_message TEXT,
    recipient_birthday DATE
);
