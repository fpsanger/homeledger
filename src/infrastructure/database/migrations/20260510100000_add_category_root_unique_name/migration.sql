CREATE UNIQUE INDEX "categories_root_name_unique" ON "Category"("name") WHERE "parentId" IS NULL;
