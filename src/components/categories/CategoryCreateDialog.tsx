"use client";

import { Dialog } from "@/components/ui/dialog";
import { CategoryForm } from "./CategoryForm";

type Category = {
  id: string;
  name: string;
parentId: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultParentId?: string;
};

export function CategoryCreateDialog({ open, onClose, categories, defaultParentId }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Nova Categoria">
      <CategoryForm categories={categories} defaultParentId={defaultParentId} onSuccess={onClose} />
    </Dialog>
  );
}
