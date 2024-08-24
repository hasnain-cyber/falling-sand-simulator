import { CANVAS_HEIGHT, CANVAS_WIDTH, CELL_WIDTH, FRAMERATE, SLIPPAGE } from "./utils/constants";
import { getRandomColor } from "./utils/helperFunctions";

const width = CANVAS_WIDTH;
const height = CANVAS_HEIGHT;
const nCellsInline = Math.floor(width / CELL_WIDTH);
const nCellsVertical = Math.floor(height / CELL_WIDTH);

let isMouseDown = false;
let mousePosition = { x: 0, y: 0 };
let currentColor = getRandomColor();
let grid = Array(nCellsVertical).fill(Array(nCellsInline).fill({ present: false, fixed: false }));

let canvas: HTMLCanvasElement;

const updateGrid = (ctx: CanvasRenderingContext2D) => {
  if (isMouseDown) {
    updateMousePosition({ clientX: mousePosition.x, clientY: mousePosition.y } as MouseEvent);
  }

  const newGrid = grid.map((row) => row.slice());
  for (let i = nCellsVertical - 2; i >= 0; i--) {
    for (let j = 0; j < nCellsInline; j++) {
      if (newGrid[i][j].present && !newGrid[i + 1][j].fixed) {
        const canFallStraight = i + 1 < nCellsVertical && !newGrid[i + 1][j].present;
        const canFallLeft = i + 1 < nCellsVertical && j > 0 && !newGrid[i + 1][j - 1].present;
        const canFallRight = i + 1 < nCellsVertical && j < nCellsInline - 1 && !newGrid[i + 1][j + 1].present;

        if (canFallStraight) {
          newGrid[i + 1][j] = newGrid[i][j];
          newGrid[i][j] = { present: false, fixed: false };
        } else if (SLIPPAGE > 0) {
          const random = Math.random();
          if (random < SLIPPAGE / 2 && canFallLeft) {
            newGrid[i + 1][j - 1] = newGrid[i][j];
            newGrid[i][j] = { present: false, fixed: false };
          } else if (random < SLIPPAGE && canFallRight) {
            newGrid[i + 1][j + 1] = newGrid[i][j];
            newGrid[i][j] = { present: false, fixed: false };
          }
        }
      }
    }
  }
  grid = newGrid;
  renderGrid(ctx);
};

const renderGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < nCellsVertical; i++) {
    for (let j = 0; j < nCellsInline; j++) {
      if (grid[i][j].present) {
        ctx.fillStyle = grid[i][j].color || 'white';
        ctx.fillRect(j * CELL_WIDTH, i * CELL_WIDTH, CELL_WIDTH, CELL_WIDTH);
        ctx.strokeStyle = grid[i][j].color || 'white';
        ctx.strokeRect(j * CELL_WIDTH, i * CELL_WIDTH, CELL_WIDTH, CELL_WIDTH);
      }
    }
  }
};

const handleMouseDown = (event: MouseEvent) => {
  isMouseDown = true;
  currentColor = getRandomColor();
  updateMousePosition(event);
};

const handleMouseUp = () => {
  isMouseDown = false;
};

const handleMouseMove = (event: MouseEvent) => {
  if (isMouseDown) {
    updateMousePosition(event);
  }
};

const updateMousePosition = (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  mousePosition.x = event.clientX - rect.left;
  mousePosition.y = event.clientY - rect.top;
  addCell(mousePosition);
};

const addCell = (mousePosition: {x: number, y: number}) => {
  const cellX = Math.floor(mousePosition.x / CELL_WIDTH);
  const cellY = Math.floor(mousePosition.y / CELL_WIDTH);

  if(grid[cellY][cellX].present) {
    return;
  }

  if (cellX >= 0 && cellX < nCellsInline && cellY >= 0 && cellY < nCellsVertical) {
    grid[cellY][cellX] = { present: true, fixed: false, color: currentColor };
  }
};

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mousemove', handleMouseMove);

  setInterval(() => {
    updateGrid(canvas.getContext('2d')!);
  }, 1000 / FRAMERATE);

  return () => {
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mousemove', handleMouseMove);
  };
});