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
        const diffButtons = document.querySelectorAll('.btn-difficulty');
        if (diffButtons.length > 0) {
            diffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const diff = btn.dataset.difficulty;
                    if (diff) {
                        this.difficulty = diff;
                        this.startGame();
                    }
                });
            });
        }

        // Controls
        const elements = {
            'reset-btn': () => this.startGame(),
            'new-game-btn': () => this.resetToMenu(),
            'back-to-menu-btn': () => this.resetToMenu(),
            'hint-btn': () => this.useHint()
        };

        for (const [id, action] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', action);
        }

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
        if (this.victoryModal) this.victoryModal.classList.add('hidden');
        if (this.playScreen) this.playScreen.classList.add('hidden');
        if (this.selectionScreen) this.selectionScreen.classList.remove('hidden');
    }

    startGame() {
        const counts = { 'easy': 42, 'medium': 32, 'hard': 24 };
        const clues = counts[this.difficulty] || 32;
        this.hintsRemaining = 3;
        this.updateUI();

        this.generatePuzzle(clues);
        this.renderGrid();

        // Check for blocks that might already be complete
        [0, 3, 6, 27, 30, 33, 54, 57, 60].forEach(idx => this.checkBlockCompletion(idx));

        if (this.selectionScreen) this.selectionScreen.classList.add('hidden');
        if (this.playScreen) this.playScreen.classList.remove('hidden');
        if (this.victoryModal) this.victoryModal.classList.add('hidden');
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
        if (cell.classList.contains('fixed')) return;
        if (this.selectedCell) this.selectedCell.classList.remove('selected');
        this.selectedCell = cell;
        this.selectedCell.classList.add('selected');
    }


    updateCellValue(cell, val) {
        const idx = parseInt(cell.dataset.index);
        cell.innerText = val;
        const numVal = val === '' ? 0 : parseInt(val);
        this.grid[idx] = numVal;

        // Força a reinicialização das classes para disparar animações
        cell.classList.remove('error', 'success');

        if (numVal !== 0) {
            // Pequeno delay para garantir que o navegador perceba a remoção da classe e reinicie a animação se necessário
            void cell.offsetWidth;
            this.validateCell(cell);
        }
    }

    validateCell(cell) {
        const idx = parseInt(cell.dataset.index);
        const val = this.grid[idx];

        if (val === 0) return; // Nothing to validate

        if (val === this.solution[idx]) {
            cell.classList.remove('error');
            cell.classList.add('success', 'fixed'); // Adiciona 'fixed' para travar
            cell.classList.remove('selected');
            if (this.selectedCell === cell) this.selectedCell = null;
            this.checkBlockCompletion(idx);
        } else {
            cell.classList.remove('success');
            cell.classList.add('error');
        }

        this.checkWin();
    }

    checkBlockCompletion(idx) {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;

        const blockIndices = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                blockIndices.push((blockRow + r) * 9 + (blockCol + c));
            }
        }

        const isBlockComplete = blockIndices.every(i => this.grid[i] === this.solution[i]);

        if (isBlockComplete) {
            blockIndices.forEach(i => {
                const cell = this.gridElement.children[i];
                cell.classList.add('success', 'fixed');
                cell.classList.remove('selected');
            });
            if (this.selectedCell && this.selectedCell.classList.contains('fixed')) {
                this.selectedCell = null;
            }
        }
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

            this.checkBlockCompletion(randomIdx);
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
