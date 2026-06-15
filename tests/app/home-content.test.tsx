import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HomeContent } from "@/app/components/home-content";

afterEach(cleanup);

describe("HomeContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("first-time visitor sees 'See it in your room' label", async () => {
    render(<HomeContent />);
    // Wait for hydration effect
    await act(async () => {});
    expect(screen.getByText("See it in your room")).toBeInTheDocument();
    expect(screen.queryByText("Continue visualizing")).not.toBeInTheDocument();
  });

  it("with room in session shows 'Continue visualizing' label", async () => {
    sessionStorage.setItem(
      "nectar.currentRoomBase64",
      "data:image/png;base64,iVBORw0KG",
    );
    localStorage.setItem("nectar.lastRoomType", "formal_living");
    render(<HomeContent />);
    await act(async () => {});
    expect(screen.getByText("Continue visualizing")).toBeInTheDocument();
    expect(screen.queryByText("See it in your room")).not.toBeInTheDocument();
  });

  it("renders Card 2 (Shop your Pinterest) in both states", async () => {
    render(<HomeContent />);
    await act(async () => {});
    expect(screen.getByText(/Shop your Pinterest/)).toBeInTheDocument();
    expect(screen.getByText("Soon")).toBeInTheDocument();
  });

  it("renders the closing flourish", async () => {
    render(<HomeContent />);
    await act(async () => {});
    expect(screen.getByText(/Every product, in your room/)).toBeInTheDocument();
  });
});
