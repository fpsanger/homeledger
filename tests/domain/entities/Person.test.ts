import { createPerson } from "../../../src/domain/entities/Person";

describe("Person entity", () => {
  describe("createPerson", () => {
    it("creates a person with valid name", () => {
      const person = createPerson({ id: "person-1", name: "Felipe" });

      expect(person.id).toBe("person-1");
      expect(person.name).toBe("Felipe");
    });

    it("trims whitespace from name", () => {
      const person = createPerson({ id: "person-1", name: "  Ana  " });

      expect(person.name).toBe("Ana");
    });

    it("throws when name is empty string", () => {
      expect(() => createPerson({ id: "person-1", name: "" })).toThrow("Name is required");
    });

    it("throws when name is only whitespace", () => {
      expect(() => createPerson({ id: "person-1", name: "   " })).toThrow("Name is required");
    });

    it("does not require workspace_id", () => {
      const person = createPerson({ id: "person-1", name: "Felipe" });

      expect(person).not.toHaveProperty("workspaceId");
      expect(person).not.toHaveProperty("workspace_id");
    });
  });
});
