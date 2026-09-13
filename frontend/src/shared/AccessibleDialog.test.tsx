import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { AccessibleDialog } from "./AccessibleDialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">Open confirmation</button>
      {open ? (
        <AccessibleDialog label="Confirm safety action" onDismiss={() => setOpen(false)}>
          <button data-dialog-initial-focus type="button">Confirm</button>
          <button onClick={() => setOpen(false)} type="button">Cancel</button>
        </AccessibleDialog>
      ) : null}
    </>
  );
}

describe("AccessibleDialog", () => {
  it("traps focus, dismisses with Escape, and restores the trigger focus", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open confirmation" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Confirm safety action" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
