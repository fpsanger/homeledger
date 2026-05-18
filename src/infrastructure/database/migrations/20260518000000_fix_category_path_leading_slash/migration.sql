-- Fix Category path: remove leading slash added by bug
UPDATE "Category"
SET path = LTRIM(path, '/')
WHERE path LIKE '/%';
