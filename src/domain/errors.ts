export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DuplicateCategoryError extends Error {
  constructor(name: string) {
    super(`Categoria "${name}" já existe`);
    this.name = "DuplicateCategoryError";
  }
}
