import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BingoGridEditor from "../../components/BingoGridEditor";
import { Tile } from "../../types/models";

describe("BingoGridEditor Component", () => {
  const mockTiles: Tile[] = [
    { value: "Tile 1", position: 0 },
    { value: "Tile 2", position: 1 },
    { value: "Tile 3", position: 2 },
    { value: "Tile 4", position: 3 },
  ];

  it("should render all tiles", () => {
    const onTileChange = vi.fn();

    render(
      <BingoGridEditor
        tiles={mockTiles}
        rows={2}
        columns={2}
        onTileChange={onTileChange}
      />,
    );

    expect(screen.getByDisplayValue("Tile 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tile 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tile 3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tile 4")).toBeInTheDocument();
  });

  it("should have correct grid layout classes", () => {
    const onTileChange = vi.fn();

    const { container } = render(
      <BingoGridEditor
        tiles={mockTiles}
        rows={2}
        columns={2}
        onTileChange={onTileChange}
      />,
    );

    const grid = container.querySelector(".bingo-grid");
    expect(grid).toBeInTheDocument();
  });

  it("should call onTileChange when tile value changes", () => {
    const onTileChange = vi.fn();

    render(
      <BingoGridEditor
        tiles={mockTiles}
        rows={2}
        columns={2}
        onTileChange={onTileChange}
      />,
    );

    const firstTile = screen.getByDisplayValue("Tile 1");
    fireEvent.change(firstTile, { target: { value: "Updated Tile 1" } });

    expect(onTileChange).toHaveBeenCalledWith(0, "Updated Tile 1");
  });

  it("should render empty tiles with placeholder text", () => {
    const emptyTiles: Tile[] = [
      { value: "", position: 0 },
      { value: "", position: 1 },
    ];
    const onTileChange = vi.fn();

    render(
      <BingoGridEditor
        tiles={emptyTiles}
        rows={1}
        columns={2}
        onTileChange={onTileChange}
      />,
    );

    const textarea1 = screen.getByPlaceholderText("Tile 1");
    const textarea2 = screen.getByPlaceholderText("Tile 2");
    expect(textarea1).toBeInTheDocument();
    expect(textarea2).toBeInTheDocument();
  });

  it("should apply correct grid dimensions", () => {
    const largeTiles: Tile[] = Array.from({ length: 12 }, (_, i) => ({
      value: `Tile ${i}`,
      position: i,
    }));
    const onTileChange = vi.fn();

    const { container } = render(
      <BingoGridEditor
        tiles={largeTiles}
        rows={3}
        columns={4}
        onTileChange={onTileChange}
      />,
    );

    const grid = container.querySelector(".bingo-grid");
    const style = window.getComputedStyle(grid!);
    expect(style.getPropertyValue("grid-template-columns")).toBeTruthy();
  });

  it("should call onTileClick when tile is clicked on mobile", () => {
    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const mockTiles: Tile[] = [
      { value: "Tile 1", position: 0 },
      { value: "Tile 2", position: 1 },
    ];
    const onTileChange = vi.fn();
    const onTileClick = vi.fn();

    render(
      <BingoGridEditor
        tiles={mockTiles}
        rows={1}
        columns={2}
        onTileChange={onTileChange}
        onTileClick={onTileClick}
      />,
    );

    const firstTile = screen.getByDisplayValue("Tile 1").closest(".bingo-tile");
    fireEvent.click(firstTile!);

    expect(onTileClick).toHaveBeenCalledWith({
      value: "Tile 1",
      position: 0,
    });

    // Reset window width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should not call onTileClick when not on mobile", () => {
    // Mock desktop viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const mockTiles: Tile[] = [
      { value: "Tile 1", position: 0 },
      { value: "Tile 2", position: 1 },
    ];
    const onTileChange = vi.fn();
    const onTileClick = vi.fn();

    render(
      <BingoGridEditor
        tiles={mockTiles}
        rows={1}
        columns={2}
        onTileChange={onTileChange}
        onTileClick={onTileClick}
      />,
    );

    const firstTile = screen.getByDisplayValue("Tile 1").closest(".bingo-tile");
    fireEvent.click(firstTile!);

    expect(onTileClick).not.toHaveBeenCalled();
  });
});
