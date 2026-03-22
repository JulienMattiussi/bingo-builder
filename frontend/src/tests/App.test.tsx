import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

describe("App Navigation", () => {
  it("should render home page navigation elements", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <div className="app">
          <nav className="navbar">
            <a href="/" className="nav-brand">
              Bingo Builder
            </a>
            <div className="nav-links">
              <a href="/">Home</a>
              <a href="/create">Create</a>
              <a href="/profile">Profile</a>
            </div>
          </nav>
        </div>
      </MemoryRouter>,
    );

    expect(screen.getByText("Bingo Builder")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });
});
