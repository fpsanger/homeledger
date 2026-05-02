export interface PersonRecord {
  id: string;
  name: string;
  createdAt: Date;
}

export interface IPersonRepository {
  findAll(): Promise<PersonRecord[]>;
  findById(id: string): Promise<PersonRecord | null>;
  save(person: Omit<PersonRecord, "createdAt">): Promise<PersonRecord>;
  delete(id: string): Promise<void>;
}
