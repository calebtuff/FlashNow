-- CreateTable
CREATE TABLE "stripe_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "wallet_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_payments_stripe_session_id_key" ON "stripe_payments"("stripe_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_payments_stripe_payment_intent_id_key" ON "stripe_payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_payments_wallet_transaction_id_key" ON "stripe_payments"("wallet_transaction_id");

-- CreateIndex
CREATE INDEX "stripe_payments_user_id_idx" ON "stripe_payments"("user_id");

-- AddForeignKey
ALTER TABLE "stripe_payments" ADD CONSTRAINT "stripe_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
