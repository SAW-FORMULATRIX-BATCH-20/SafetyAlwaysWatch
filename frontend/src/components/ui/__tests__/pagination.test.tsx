import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../pagination";

describe("Pagination Component", () => {
  it("renders pagination with current and total pages", () => {
    render(
      <Pagination
        ariaLabel="Test pagination"
        currentPage={2}
        onPageChange={() => {}}
        totalPages={5}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Test pagination" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });

  it("disables Previous page button on first page", () => {
    render(
      <Pagination
        currentPage={1}
        onPageChange={() => {}}
        totalPages={3}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });

  it("disables Next page button on last page", () => {
    render(
      <Pagination
        currentPage={3}
        onPageChange={() => {}}
        totalPages={3}
      />,
    );

    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("calls onPageChange when clicking navigation buttons", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        onPageChange={handlePageChange}
        totalPages={4}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(handlePageChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(handlePageChange).toHaveBeenCalledTimes(2);
  });

  it("renders nothing when totalPages is 1 or less", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        onPageChange={() => {}}
        totalPages={1}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
