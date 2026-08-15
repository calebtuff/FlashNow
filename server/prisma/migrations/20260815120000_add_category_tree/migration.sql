-- Phase 1 of the category tree: additive schema only.
--
-- After this migration every existing category remains a top-level category
-- (parent_id IS NULL) and no application code reads the new columns yet, so
-- this is safe to deploy on its own. Subcategories are inserted separately by
-- the seed (phase 2), and existing auctions are deliberately NOT re-pointed:
-- an auction still referencing a parent simply means "subcategory
-- unspecified", and the search resolves a parent to itself plus its children.

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "parent_id" TEXT;
ALTER TABLE "categories" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
-- `name` can no longer be globally unique: the same leaf name may legitimately
-- appear under two different parents. Uniqueness moves to (parent_id, name).
DROP INDEX "categories_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "categories_parent_id_name_key" ON "categories"("parent_id", "name");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- AddForeignKey
-- RESTRICT rather than CASCADE: deleting a parent that still has children
-- should fail loudly instead of silently removing a whole branch.
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Give the existing top-level categories a deliberate order. Anything not
-- listed keeps sort_order 0 and sorts by name after these.
UPDATE "categories" SET "sort_order" = 10 WHERE "slug" = 'fashion';
UPDATE "categories" SET "sort_order" = 20 WHERE "slug" = 'electronics';
UPDATE "categories" SET "sort_order" = 30 WHERE "slug" = 'collectibles';
UPDATE "categories" SET "sort_order" = 40 WHERE "slug" = 'sports';
UPDATE "categories" SET "sort_order" = 50 WHERE "slug" = 'jewelry';
UPDATE "categories" SET "sort_order" = 60 WHERE "slug" = 'art';
UPDATE "categories" SET "sort_order" = 70 WHERE "slug" = 'toys-games';
UPDATE "categories" SET "sort_order" = 80 WHERE "slug" = 'home-garden';
UPDATE "categories" SET "sort_order" = 90 WHERE "slug" = 'vehicles';
UPDATE "categories" SET "sort_order" = 999 WHERE "slug" = 'other';
