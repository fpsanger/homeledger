CREATE UNIQUE INDEX "categories_root_name_unique" ON "Category"("name", "householdId") WHERE "parentId" IS NULL;
