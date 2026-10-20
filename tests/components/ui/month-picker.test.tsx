/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MonthPicker } from "@/components/ui/month-picker";

function renderPicker(props: Partial<React.ComponentProps<typeof MonthPicker>> = {}) {
  const onChange = jest.fn();
  render(<MonthPicker value="2026-10" onChange={onChange} ariaLabel="Fatura" {...props} />);
  return { onChange };
}

describe("MonthPicker", () => {
  it("shows the selected month in pt-BR on the trigger", () => {
    renderPicker();
    expect(screen.getByRole("button", { name: "Fatura" })).toHaveTextContent("out/2026");
  });

  it("shows the placeholder when empty", () => {
    renderPicker({ value: "", placeholder: "Automática" });
    expect(screen.getByRole("button", { name: "Fatura" })).toHaveTextContent("Automática");
  });

  it("opens on the selected year and marks the selected month", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));

    expect(await screen.findByText("2026")).toBeVisible();
    expect(screen.getByRole("button", { name: "outubro de 2026" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "março de 2026" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("picks a month as YYYY-MM", async () => {
    const { onChange } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
    fireEvent.click(await screen.findByRole("button", { name: "março de 2026" }));

    expect(onChange).toHaveBeenCalledWith("2026-03");
  });

  it("navigates years before picking", async () => {
    const { onChange } = renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
    fireEvent.click(await screen.findByRole("button", { name: "Próximo ano" }));
    fireEvent.click(screen.getByRole("button", { name: "janeiro de 2027" }));

    expect(onChange).toHaveBeenCalledWith("2027-01");

    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ano anterior" }));
    expect(screen.getByText("2025")).toBeVisible();
  });

  it("offers a clear option only when clearLabel is given", async () => {
    const { onChange } = renderPicker({ clearLabel: "Automática pelo fechamento" });
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
    fireEvent.click(await screen.findByRole("button", { name: "Automática pelo fechamento" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("has no clear option by default", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
    await screen.findByText("2026");

    expect(screen.queryByRole("button", { name: /Automática/ })).not.toBeInTheDocument();
  });

  it("does not open when disabled", () => {
    renderPicker({ disabled: true });
    fireEvent.click(screen.getByRole("button", { name: "Fatura" }));

    expect(screen.queryByText("2026")).not.toBeInTheDocument();
  });

  describe("min/max bounds", () => {
    async function openBounded() {
      const { onChange } = renderPicker({ minValue: "2026-03", maxValue: "2026-10" });
      fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
      await screen.findByText("2026");
      return { onChange };
    }

    it("disables months before minValue", async () => {
      await openBounded();
      expect(screen.getByRole("button", { name: "fevereiro de 2026" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "março de 2026" })).toBeEnabled();
    });

    it("disables months after maxValue", async () => {
      await openBounded();
      expect(screen.getByRole("button", { name: "novembro de 2026" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "outubro de 2026" })).toBeEnabled();
    });

    it("does not report a pick for an out-of-range month", async () => {
      const { onChange } = await openBounded();
      fireEvent.click(screen.getByRole("button", { name: "fevereiro de 2026" }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("stops the year steppers at the boundary years", async () => {
      await openBounded();
      expect(screen.getByRole("button", { name: "Ano anterior" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Próximo ano" })).toBeDisabled();
    });

    it("leaves every month selectable when unbounded", async () => {
      renderPicker();
      fireEvent.click(screen.getByRole("button", { name: "Fatura" }));
      await screen.findByText("2026");

      expect(screen.getByRole("button", { name: "fevereiro de 2026" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Ano anterior" })).toBeEnabled();
    });
  });
});
