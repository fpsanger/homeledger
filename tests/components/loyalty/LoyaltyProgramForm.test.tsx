/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoyaltyProgramForm } from "@/components/loyalty/LoyaltyProgramForm";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

function lastRequest() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, method: init.method, body: JSON.parse(init.body) };
}

describe("LoyaltyProgramForm", () => {
  it("creates a program without a reference range by sending nulls", async () => {
    const onSuccess = jest.fn();
    render(<LoyaltyProgramForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Smiles" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const req = lastRequest();
    expect(req.url).toBe("/api/loyalty/programs");
    expect(req.method).toBe("POST");
    expect(req.body).toMatchObject({
      name: "Smiles",
      referenceMinPer1kBrl: null,
      referenceMaxPer1kBrl: null,
    });
  });

  it("sends the reference range as numbers", async () => {
    const onSuccess = jest.fn();
    render(<LoyaltyProgramForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "LATAM" } });
    fireEvent.change(screen.getByLabelText("Referência mínima por milheiro"), {
      target: { value: "24" },
    });
    fireEvent.change(screen.getByLabelText("Referência máxima por milheiro"), {
      target: { value: "26.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(lastRequest().body).toMatchObject({
      referenceMinPer1kBrl: 24,
      referenceMaxPer1kBrl: 26.5,
    });
  });

  it("edits an existing program: prefilled, PUT, and clearing a bound sends null", async () => {
    const onSuccess = jest.fn();
    render(
      <LoyaltyProgramForm
        program={{
          id: "latam",
          name: "LATAM Pass",
          type: "AIRLINE",
          color: "#3b82f6",
          referenceMinPer1kBrl: 24,
          referenceMaxPer1kBrl: 26,
        }}
        onSuccess={onSuccess}
      />,
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("LATAM Pass");
    expect(screen.getByLabelText("Referência mínima por milheiro")).toHaveValue(24);

    fireEvent.change(screen.getByLabelText("Referência máxima por milheiro"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const req = lastRequest();
    expect(req.url).toBe("/api/loyalty/programs/latam");
    expect(req.method).toBe("PUT");
    expect(req.body).toMatchObject({ referenceMinPer1kBrl: 24, referenceMaxPer1kBrl: null });
  });

  it("shows the API error and does not call onSuccess", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "referenceMinPer1kBrl must not exceed referenceMaxPer1kBrl" }),
    });
    const onSuccess = jest.fn();
    render(<LoyaltyProgramForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/must not exceed/)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
