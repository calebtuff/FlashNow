-- CreateTable
CREATE TABLE "auction_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auction_favorites_user_id_created_at_idx" ON "auction_favorites"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "auction_favorites_user_id_auction_id_key" ON "auction_favorites"("user_id", "auction_id");

-- AddForeignKey
ALTER TABLE "auction_favorites" ADD CONSTRAINT "auction_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_favorites" ADD CONSTRAINT "auction_favorites_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
