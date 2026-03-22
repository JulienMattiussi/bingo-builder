import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BingoGridControls from "../../components/BingoGridControls";
import { Tile } from "../../types/models";

describe("BingoGridControls Component", () => {
  const mockTiles: Tile[] = Array.from({ length: 9 }, (_, i) => ({
    value: `Tile ${i}`,
    position: i,
  }));

  it("should display current title", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Bingo Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    expect(screen.getByDisplayValue("Test Bingo Card")).toBeInTheDocument();
  });

  it("should call onTitleChange when title is edited", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Old Title"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    const titleInput = screen.getByDisplayValue("Old Title");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    expect(onTitleChange).toHaveBeenCalledWith("New Title");
  });

  it("should display current grid dimensions", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={4}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    expect(screen.getByText(/Columns:/)).toBeInTheDocument();
    expect(screen.getByText(/Rows:/)).toBeInTheDocument();
  });

  it("should display tile count", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    expect(screen.getByText(/tiles/i)).toBeInTheDocument();
  });

  it("should call onGridSizeChange when row is increased", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    const increaseRowBtns = screen.getAllByText("+");
    const increaseRowBtn = increaseRowBtns[1];
    fireEvent.click(increaseRowBtn);

    expect(onGridSizeChange).toHaveBeenCalledWith(4, 3);
  });

  it("should call onGridSizeChange when column is decreased", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    const decreaseColBtns = screen.getAllByText("−");
    const decreaseColBtn = decreaseColBtns[0];
    fireEvent.click(decreaseColBtn);

    expect(onGridSizeChange).toHaveBeenCalledWith(3, 2);
  });

  it("should disable decrease button at minimum rows", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={2}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    const decreaseRowBtns = screen.getAllByText("−");
    expect(decreaseRowBtns[1]).toBeDisabled();
  });

  it("should disable increase button at maximum columns", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={6}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    const increaseColBtns = screen.getAllByText("+");
    expect(increaseColBtns[0]).toBeDisabled();
  });

  it("should always show progress section", () => {
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={mockTiles}
      />,
    );

    expect(screen.getByText(/Progress/i)).toBeInTheDocument();
  });

  it("should show complete status when all tiles are filled", () => {
    const filledTiles: Tile[] = Array.from({ length: 9 }, (_, i) => ({
      value: `Filled Tile ${i}`,
      position: i,
    }));
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={filledTiles}
      />,
    );

    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("should show incomplete status badge type", () => {
    const incompleteTiles: Tile[] = Array.from({ length: 9 }, (_, i) => ({
      value: i < 5 ? `Tile ${i}` : "",
      position: i,
    }));
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={incompleteTiles}
        statusBadgeType="incomplete"
      />,
    );

    expect(screen.getByText("Incomplete")).toBeInTheDocument();
  });

  it("should show draft status badge type", () => {
    const incompleteTiles: Tile[] = Array.from({ length: 9 }, (_, i) => ({
      value: i < 5 ? `Tile ${i}` : "",
      position: i,
    }));
    const onTitleChange = vi.fn();
    const onGridSizeChange = vi.fn();

    render(
      <BingoGridControls
        title="Test Card"
        onTitleChange={onTitleChange}
        rows={3}
        columns={3}
        onGridSizeChange={onGridSizeChange}
        tiles={incompleteTiles}
        statusBadgeType="draft"
      />,
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
