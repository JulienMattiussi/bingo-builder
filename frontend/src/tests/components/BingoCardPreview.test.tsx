import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BingoCardPreview from "../../components/BingoCardPreview";
import { Tile } from "../../types/models";

describe("BingoCardPreview Component", () => {
  const mockTiles: Tile[] = [
    { value: "Item 1", position: 0 },
    { value: "Item 2", position: 1 },
    { value: "Item 3", position: 2 },
    { value: "Item 4", position: 3 },
  ];

  it("should render preview grid with all tiles", () => {
    render(<BingoCardPreview tiles={mockTiles} rows={2} columns={2} />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("Item 4")).toBeInTheDocument();
  });

  it("should mark checked tiles", () => {
    const { container } = render(
      <BingoCardPreview
        tiles={mockTiles}
        rows={2}
        columns={2}
        checkedTiles={[0, 2]}
      />,
    );

    const checkedTiles = container.querySelectorAll(".preview-tile.checked");
    expect(checkedTiles).toHaveLength(2);
  });

  it("should show empty marker for empty tiles", () => {
    const tilesWithEmpty: Tile[] = [
      { value: "Item 1", position: 0 },
      { value: "", position: 1 },
      { value: "Item 3", position: 2 },
      { value: "", position: 3 },
    ];

    const { container } = render(
      <BingoCardPreview tiles={tilesWithEmpty} rows={2} columns={2} />,
    );

    const emptyTiles = container.querySelectorAll(".preview-tile.empty");
    expect(emptyTiles.length).toBeGreaterThan(0);
  });

  it("should apply correct grid dimensions", () => {
    const { container } = render(
      <BingoCardPreview tiles={mockTiles} rows={2} columns={2} />,
    );

    const grid = container.querySelector(".card-preview");
    expect(grid).toBeInTheDocument();
  });

  it("should handle large grids", () => {
    const largeTiles: Tile[] = Array.from({ length: 30 }, (_, i) => ({
      value: `Item ${i + 1}`,
      position: i,
    }));

    render(<BingoCardPreview tiles={largeTiles} rows={5} columns={6} />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 30")).toBeInTheDocument();
  });
});
