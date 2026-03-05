/**
 * 🧩 Sudoku Web: Minimalist Edition - Logic Engine
 * Powered by Antigravity
 */

class SudokuGame {
    constructor() {
        this.grid = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.difficulty = 'medium';
        this.hintsRemaining = 3;
        this.selectedCell = null;

        // DOM Elements
        this.gridElement = document.getElementById('sudoku-grid');
        this.hintsElement = document.getElementById('hints-remaining');
        this.playScreen = document.getElementById('play-screen');
        this.selectionScreen = document.getElementById('selection-screen');
        this.victoryModal = document.getElementById('victory-modal');

        this.init();
    }

    init() {
        // Difficulty Buttons
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.difficulty;
                this.startGame();
            });
        });

        // Controls
        document.getElementById('reset-btn').addEventListener('click', () => this.startGame());
        document.getElementById('new-game-btn').addEventListener('click', () => this.resetToMenu());
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.useHint();
            }
            if (this.selectedCell && !this.selectedCell.classList.contains('fixed')) {
                if (e.key >= '1' && e.key <= '9') {
                    this.updateCellValue(this.selectedCell, e.key);
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    this.updateCellValue(this.selectedCell, '');
                } else if (e.key === 'Enter') {
                    this.validateCell(this.selectedCell);
                }
            }
        });
    }

    resetToMenu() {
        this.victoryModal.classList.add('hidden');
        this.playScreen.classList.add('hidden');
        this.selectionScreen.classList.remove('hidden');
    }

    startGame() {
        const counts = { 'easy': 40, 'medium': 30, 'hard': 22 };
        this.hintsRemaining = 3;
        this.updateUI();

        this.generatePuzzle(counts[this.difficulty]);
        this.renderGrid();

        this.selectionScreen.classList.add('hidden');
        this.playScreen.classList.remove('hidden');
    }

    updateUI() {
        this.hintsElement.innerText = this.hintsRemaining;
    }

    // --- Sudoku Generation Logic ---

    generatePuzzle(clues) {
        // 1. Generate full solved grid
        this.grid = Array(81).fill(0);
        this.solve(this.grid);
        this.solution = [...this.grid];

        // 2. Remove numbers to create the puzzle
        let attempts = 81 - clues;
        while (attempts > 0) {
            let idx = Math.floor(Math.random() * 81);
            if (this.grid[idx] !== 0) {
                this.grid[idx] = 0;
                attempts--;
            }
        }
    }

    isValid(board, idx, val) {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 9; i++) {
            // Check row, col and 3x3 box
            if (board[row * 9 + i] === val) return false;
            if (board[i * 9 + col] === val) return false;
            if (board[(boxRow + Math.floor(i / 3)) * 9 + (boxCol + (i % 3))] === val) return false;
        }
        return true;
    }

    solve(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (let num of nums) {
                    if (this.isValid(board, i, num)) {
                        board[i] = num;
                        if (this.solve(board)) return true;
                        board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Rendering & Interaction ---

    renderGrid() {
        this.gridElement.innerHTML = '';
        this.grid.forEach((val, i) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;

            if (val !== 0) {
                cell.innerText = val;
                cell.classList.add('fixed');
            } else {
                cell.addEventListener('click', () => this.selectCell(cell));
            }

            this.gridElement.appendChild(cell);
        });
    }

    selectCell(cell) {
        if (this.selectedCell) this.selectedCell.classList.remove('selected');
        this.selectedCell = cell;
        this.selectedCell.classList.add('selected');
    }

    updateCellValue(cell, val) {
        const idx = parseInt(cell.dataset.index);
        cell.innerText = val;
        this.grid[idx] = val === '' ? 0 : parseInt(val);

        // Clear previous validation status when typing
        cell.classList.remove('error', 'success');
    }

    validateCell(cell) {
        const idx = parseInt(cell.dataset.index);
        const val = this.grid[idx];

        if (val === 0) return; // Nothing to validate

        if (val === this.solution[idx]) {
            cell.classList.remove('error');
            cell.classList.add('success');
        } else {
            cell.classList.remove('success');
            cell.classList.add('error');
        }

        this.checkWin();
    }


    useHint() {
        if (this.hintsRemaining <= 0) return;

        // Find empty cells or cells with errors
        const availableIndices = [];
        this.grid.forEach((val, i) => {
            if (val === 0 || val !== this.solution[i]) {
                availableIndices.push(i);
            }
        });

        if (availableIndices.length > 0) {
            const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            const correctValue = this.solution[randomIdx];

            // Find the cell in DOM
            const cell = this.gridElement.children[randomIdx];
            this.grid[randomIdx] = correctValue;
            cell.innerText = correctValue;
            cell.classList.remove('error');
            cell.classList.add('fixed', 'hint-revealed'); // Make it fixed so user can't change it

            this.hintsRemaining--;
            this.updateUI();

            this.checkWin();

        }
    }

    checkWin() {
        const isComplete = this.grid.every((val, i) => val === this.solution[i]);
        if (isComplete) {
            this.victoryModal.classList.remove('hidden');
        }
    }
}

// Start Game
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
