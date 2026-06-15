import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { BottomNav } from "@/app/components/bottom-nav";

afterEach(cleanup);

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

describe("BottomNav", () => {
  it("renders exactly 2 tabs: Home and Inspire", () => {
    render(<BottomNav />);
    const tabs = screen.getAllByRole("link");
    expect(tabs).toHaveLength(2);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Inspire")).toBeInTheDocument();
  });

  it("Home tab links to /", () => {
    render(<BottomNav />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("Inspire tab links to /inspire", () => {
    render(<BottomNav />);
    const inspireLink = screen.getByText("Inspire").closest("a");
    expect(inspireLink).toHaveAttribute("href", "/inspire");
  });
});
