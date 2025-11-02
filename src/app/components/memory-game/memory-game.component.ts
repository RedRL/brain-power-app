import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';
import { DataService } from '../../services/data.service';

interface GridCell {
  row: number;
  col: number;
  color: string;
  isPlaced: boolean;
}

interface DraggablePiece {
  id: number;
  color: string;
  isUsed: boolean;
}

@Component({
  selector: 'app-memory-game',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './memory-game.component.html',
  styleUrls: ['./memory-game.component.scss']
})
export class MemoryGameComponent implements OnInit, OnDestroy, AfterViewInit {
  level: 'beginner' | 'advanced' | 'grand' = 'beginner';
  
  // Game states
  phase: 'viewing' | 'playing' | 'completed' | 'failed' = 'viewing';
  
  // Grid configuration based on level
  gridSize: number = 3;
  viewDuration: number = 5000; // milliseconds
  
  // Pattern grid (the answer)
  patternGrid: GridCell[][] = [];
  
  // User's current grid
  userGrid: GridCell[][] = [];
  
  // Available pieces for dragging
  availablePieces: DraggablePiece[] = [];
  
  // Currently dragged piece
  draggedPiece: DraggablePiece | null = null;
  
  // Mouse drag state
  isDragging: boolean = false;
  dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  draggedElement: HTMLElement | null = null;
  
  // Bound event handlers for proper cleanup
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;
  
  // Timer
  viewTimer: any;
  countdownInterval: any;
  remainingSeconds: number = 0;
  
  // Colors palette
  colors: string[] = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  
  startTime: number = 0;
  completionTime: number = 0;
  score: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public translateService: TranslateService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.level = params['level'] || 'beginner';
      this.initializeGame();
    });
  }

  ngAfterViewInit() {
    // Ensure draggable attributes are set correctly after view init
    setTimeout(() => {
      this.updateDraggableAttributes();
    }, 100);
  }

  updateDraggableAttributes() {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const pieces = document.querySelectorAll('.draggable-piece');
      pieces.forEach((piece, index) => {
        const pieceElement = piece as HTMLElement;
        if (index < this.availablePieces.length) {
          const pieceData = this.availablePieces[index];
          if (pieceData && !pieceData.isUsed && this.phase === 'playing') {
            pieceElement.setAttribute('draggable', 'true');
            pieceElement.style.cursor = 'grab';
          } else {
            pieceElement.setAttribute('draggable', 'false');
            pieceElement.style.cursor = 'not-allowed';
          }
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.viewTimer) {
      clearTimeout(this.viewTimer);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Clean up mouse event listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }
    
    // Clean up dragged element
    if (this.draggedElement) {
      this.draggedElement.remove();
    }
  }

  initializeGame() {
    // Set difficulty based on level
    switch (this.level) {
      case 'beginner':
        this.gridSize = 3;
        this.viewDuration = 5000;
        break;
      case 'advanced':
        this.gridSize = 4;
        this.viewDuration = 6000;
        break;
      case 'grand':
        this.gridSize = 5;
        this.viewDuration = 7000;
        break;
    }

    this.generatePattern();
    this.initializeUserGrid();
    this.generateAvailablePieces();
    this.startViewingPhase();
  }

  generatePattern() {
    this.patternGrid = [];
    const usedColors: string[] = [];
    
    for (let row = 0; row < this.gridSize; row++) {
      this.patternGrid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        // Use random colors but ensure some variety
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        usedColors.push(color);
        this.patternGrid[row][col] = {
          row,
          col,
          color,
          isPlaced: true
        };
      }
    }
    
    // Ensure at least 3-4 different colors are used
    const uniqueColors = [...new Set(usedColors)];
    if (uniqueColors.length < 3) {
      // Regenerate with more variety
      this.generatePattern();
    }
  }

  initializeUserGrid() {
    this.userGrid = [];
    for (let row = 0; row < this.gridSize; row++) {
      this.userGrid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        this.userGrid[row][col] = {
          row,
          col,
          color: '',
          isPlaced: false
        };
      }
    }
  }

  generateAvailablePieces() {
    // Collect all colors from pattern
    const patternColors: string[] = [];
    this.patternGrid.forEach(row => {
      row.forEach(cell => {
        patternColors.push(cell.color);
      });
    });
    
    // Create draggable pieces - include all pattern colors + some extra for distraction
    const uniquePatternColors = [...new Set(patternColors)];
    this.availablePieces = [];
    
    // Add pattern colors
    uniquePatternColors.forEach((color, index) => {
      this.availablePieces.push({
        id: index,
        color,
        isUsed: false
      });
    });
    
    // Add a couple of extra colors as distractors (for advanced levels)
    if (this.level !== 'beginner') {
      const distractorColors = this.colors.filter(c => !uniquePatternColors.includes(c));
      distractorColors.slice(0, 2).forEach((color, index) => {
        this.availablePieces.push({
          id: uniquePatternColors.length + index,
          color,
          isUsed: false
        });
      });
    }
    
    // Shuffle pieces
    this.availablePieces = this.shuffleArray([...this.availablePieces]);
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  startViewingPhase() {
    this.phase = 'viewing';
    this.startTime = Date.now();
    this.remainingSeconds = Math.ceil(this.viewDuration / 1000);
    
    // Start countdown interval
    this.countdownInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);
    
    this.viewTimer = setTimeout(() => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      this.phase = 'playing';
      this.viewTimer = null;
      this.remainingSeconds = 0;
      
      // Update draggable attributes when entering playing phase
      setTimeout(() => {
        this.updateDraggableAttributes();
      }, 100);
    }, this.viewDuration);
  }

  trackByPieceId(index: number, piece: DraggablePiece): number {
    return piece.id;
  }

  onPieceMouseDown(event: MouseEvent, piece: DraggablePiece) {
    // Allow left mouse button only
    if (event.button !== 0) {
      return;
    }
    
    if (piece.isUsed || this.phase !== 'playing') {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    this.isDragging = true;
    this.draggedPiece = piece;
    
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      return;
    }
    
    this.draggedElement = target.cloneNode(true) as HTMLElement;
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.style.zIndex = '10000';
    this.draggedElement.style.opacity = '0.8';
    this.draggedElement.style.transform = 'scale(1.2)';
    this.draggedElement.style.cursor = 'grabbing';
    
    const rect = target.getBoundingClientRect();
    this.dragOffset.x = event.clientX - rect.left;
    this.dragOffset.y = event.clientY - rect.top;
    
    this.draggedElement.style.left = (event.clientX - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (event.clientY - this.dragOffset.y) + 'px';
    this.draggedElement.style.width = rect.width + 'px';
    this.draggedElement.style.height = rect.height + 'px';
    
    document.body.appendChild(this.draggedElement);
    
    target.style.opacity = '0.5';
    
    // Create bound functions for proper cleanup
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    this.boundMouseUp = (e: MouseEvent) => this.onMouseUp(e);
    
    // Add global mouse event listeners with capture phase
    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('mouseup', this.boundMouseUp, true);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) {
      return;
    }
    
    if (!this.draggedElement) {
      return;
    }
    
    event.preventDefault();
    
    this.draggedElement.style.left = (event.clientX - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (event.clientY - this.dragOffset.y) + 'px';
    
    // Check which drop zone we're over
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    if (elementBelow) {
      const dropZone = elementBelow.closest('.drop-zone') as HTMLElement;
      if (dropZone) {
        // Remove drag-over from all zones
        document.querySelectorAll('.drag-over').forEach(el => {
          if (el !== dropZone) {
            el.classList.remove('drag-over');
          }
        });
        
        // Check if this drop zone is already filled
        const row = parseInt(dropZone.getAttribute('data-row') || '0');
        const col = parseInt(dropZone.getAttribute('data-col') || '0');
        
        if (!this.userGrid[row][col].isPlaced) {
          dropZone.classList.add('drag-over');
        }
      } else {
        // Remove drag-over from all zones
        document.querySelectorAll('.drag-over').forEach(el => {
          el.classList.remove('drag-over');
        });
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    if (!this.isDragging || !this.draggedPiece) {
      return;
    }
    
    event.preventDefault();
    
    // Remove global listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = null;
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
      this.boundMouseUp = null;
    }
    
    // Remove drag element
    if (this.draggedElement) {
      this.draggedElement.remove();
      this.draggedElement = null;
    }
    
    // Reset original element
    const pieces = document.querySelectorAll('.draggable-piece');
    pieces.forEach((piece) => {
      const pieceEl = piece as HTMLElement;
      if (pieceEl.style.opacity === '0.5') {
        pieceEl.style.opacity = '1';
      }
    });
    
    // Find the drop zone we're over
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    if (elementBelow && this.draggedPiece) {
      const dropZone = elementBelow.closest('.drop-zone') as HTMLElement;
      if (dropZone) {
        dropZone.classList.remove('drag-over');
        
        const row = parseInt(dropZone.getAttribute('data-row') || '0');
        const col = parseInt(dropZone.getAttribute('data-col') || '0');
        
        if (!this.userGrid[row][col].isPlaced && !this.draggedPiece.isUsed) {
          // Place the piece
          this.userGrid[row][col].color = this.draggedPiece.color;
          this.userGrid[row][col].isPlaced = true;
          this.draggedPiece.isUsed = true;
          
          // Force change detection
          this.userGrid = [...this.userGrid];
          this.availablePieces = [...this.availablePieces];
          
          // Update draggable attributes
          setTimeout(() => {
            this.updateDraggableAttributes();
          }, 0);
          
          // Check if grid is complete
          this.checkCompletion();
        }
      }
    }
    
    // Remove drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // Reset state
    this.isDragging = false;
    this.draggedPiece = null;
  }

  // Legacy drag handlers (keeping for fallback, but using mouse events)
  onDragStart(piece: DraggablePiece, event: DragEvent) {
    // Disable HTML5 drag for now, using mouse events instead
    event.preventDefault();
    return false;
  }

  onDragEnd(event: DragEvent) {
    // Not used, mouse events handle this
  }

  onDragEnter(event: DragEvent, row: number, col: number) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone') && !this.userGrid[row][col].isPlaced) {
      target.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent, row: number, col: number) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone')) {
      target.classList.remove('drag-over');
    }
  }

  onDragOver(event: DragEvent, row: number, col: number) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.userGrid[row][col].isPlaced ? 'none' : 'move';
    }
    
    // Visual feedback
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone') && !this.userGrid[row][col].isPlaced) {
      target.classList.add('drag-over');
    }
  }

  onDrop(event: DragEvent, row: number, col: number) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove drag-over class
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.classList.remove('drag-over');
    }
    
    // Get piece from draggedPiece or from dataTransfer as fallback
    let pieceToPlace: DraggablePiece | null = this.draggedPiece;
    
    if (!pieceToPlace && event.dataTransfer) {
      try {
        const data = event.dataTransfer.getData('application/json');
        if (data) {
          const parsed = JSON.parse(data);
          const found = this.availablePieces.find(p => p.id === parsed.id);
          if (found) {
            pieceToPlace = found;
          }
        }
      } catch (e) {
        // Fallback to text/plain
        const pieceId = parseInt(event.dataTransfer.getData('text/plain'));
        if (!isNaN(pieceId)) {
          const found = this.availablePieces.find(p => p.id === pieceId);
          if (found) {
            pieceToPlace = found;
          }
        }
      }
    }
    
    if (!pieceToPlace || pieceToPlace.isUsed || this.userGrid[row][col].isPlaced || this.phase !== 'playing') {
      return;
    }
    
    // Place the piece
    this.userGrid[row][col].color = pieceToPlace.color;
    this.userGrid[row][col].isPlaced = true;
    pieceToPlace.isUsed = true;
    
    this.draggedPiece = null;
    
    // Force change detection
    this.userGrid = [...this.userGrid];
    this.availablePieces = [...this.availablePieces];
    
    // Update draggable attributes after state change
    setTimeout(() => {
      this.updateDraggableAttributes();
    }, 0);
    
    // Check if grid is complete
    this.checkCompletion();
  }

  removePiece(row: number, col: number) {
    if (this.phase !== 'playing' || !this.userGrid[row][col].isPlaced) {
      return;
    }
    
    // Find the piece and mark it as unused
    const piece = this.availablePieces.find(p => p.color === this.userGrid[row][col].color && p.isUsed);
    if (piece) {
      piece.isUsed = false;
    }
    
    this.userGrid[row][col].color = '';
    this.userGrid[row][col].isPlaced = false;
  }

  checkCompletion() {
    // Check if all cells are filled
    const allFilled = this.userGrid.every(row => 
      row.every(cell => cell.isPlaced)
    );
    
    if (!allFilled) {
      return;
    }
    
    // Check if pattern matches
    let matches = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.userGrid[row][col].color === this.patternGrid[row][col].color) {
          matches++;
        }
      }
    }
    
    const totalCells = this.gridSize * this.gridSize;
    const accuracy = matches / totalCells;
    
    if (accuracy === 1) {
      // Perfect match!
      this.completionTime = Date.now() - this.startTime;
      this.score = Math.max(0, 1000 - Math.floor(this.completionTime / 100));
      this.phase = 'completed';
      this.markAsCompleted();
    } else if (accuracy >= 0.7) {
      // Good enough - close match
      this.completionTime = Date.now() - this.startTime;
      this.score = Math.max(0, Math.floor((accuracy * 1000) - Math.floor(this.completionTime / 100)));
      this.phase = 'completed';
      this.markAsCompleted();
    } else {
      // Too many mistakes
      this.phase = 'failed';
    }
  }

  markAsCompleted() {
    const durationSec = Math.floor(this.completionTime / 1000);
    // Store completion in data service if needed
    // this.dataService.addCompletion(...);
  }

  restartGame() {
    this.initializeGame();
  }

  goBack() {
    this.router.navigate(['/lets-begin']);
  }

  getRemainingViewTime(): number {
    return this.remainingSeconds;
  }
}

