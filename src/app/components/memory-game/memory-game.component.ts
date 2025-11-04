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
  gridSize: number = 2;
  gridRows: number = 2;
  gridCols: number = 2;
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
  dragStartTimer: any = null;
  dragStarted: boolean = false;
  mouseDownPosition: { x: number; y: number } = { x: 0, y: 0 };
  currentDropZone: HTMLElement | null = null;
  
  // Bound event handlers for proper cleanup
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;
  private boundTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null;
  
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
      pieces.forEach((piece) => {
        const pieceElement = piece as HTMLElement;
        if (this.phase === 'playing') {
          pieceElement.setAttribute('draggable', 'false');
          pieceElement.style.cursor = 'grab';
        } else {
          pieceElement.setAttribute('draggable', 'false');
          pieceElement.style.cursor = 'not-allowed';
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
    if (this.dragStartTimer) {
      clearTimeout(this.dragStartTimer);
    }
    
    // Clean up mouse event listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove, true);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp, true);
    }
    if (this.boundTouchMove) {
      document.removeEventListener('touchmove', this.boundTouchMove, true);
    }
    if (this.boundTouchEnd) {
      document.removeEventListener('touchend', this.boundTouchEnd, true);
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
        this.gridRows = 2;
        this.gridCols = 2; // 2x2 = 4 tiles
        this.viewDuration = 5000; // 5 seconds
        break;
      case 'advanced':
        this.gridRows = 2;
        this.gridCols = 3; // 2x3 = 6 tiles
        this.viewDuration = 10000; // 10 seconds
        break;
      case 'grand':
        this.gridRows = 2;
        this.gridCols = 4; // 2x4 = 8 tiles
        this.viewDuration = 15000; // 15 seconds
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
    
    // Define color palette based on level with very distinct colors
    let availableColors: string[];
    switch (this.level) {
      case 'beginner':
        // 4 very distinct colors: Red, Blue, Green, Orange
        availableColors = ['#E74C3C', '#3498DB', '#2ECC71', '#FF9800'];
        break;
      case 'advanced':
        // 6 colors: beginner + Purple, Yellow
        availableColors = ['#E74C3C', '#3498DB', '#2ECC71', '#FF9800', '#9B59B6', '#F1C40F'];
        break;
      case 'grand':
        // 8 colors: beginner + Purple, Yellow, Pink, Teal
        availableColors = ['#E74C3C', '#3498DB', '#2ECC71', '#FF9800', '#9B59B6', '#F1C40F', '#E91E63', '#00BCD4'];
        break;
      default:
        availableColors = this.colors;
    }
    
    for (let row = 0; row < this.gridRows; row++) {
      this.patternGrid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        // Use random colors from available palette
        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        usedColors.push(color);
        this.patternGrid[row][col] = {
          row,
          col,
          color,
          isPlaced: true
        };
      }
    }
    
    // Ensure at least 3 different colors are used (for variety)
    const uniqueColors = [...new Set(usedColors)];
    const totalTiles = this.gridRows * this.gridCols;
    const minColors = Math.min(3, totalTiles);
    
    if (uniqueColors.length < minColors) {
      // Regenerate with more variety
      this.generatePattern();
    }
  }

  initializeUserGrid() {
    this.userGrid = [];
    for (let row = 0; row < this.gridRows; row++) {
      this.userGrid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
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
    
    if (this.phase !== 'playing') {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    this.draggedPiece = piece;
    this.dragStarted = false;
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      return;
    }
    
    // Add visual feedback for press-and-hold
    target.classList.add('press-hold');
    
    // Create bound functions for proper cleanup
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    this.boundMouseUp = (e: MouseEvent) => this.onMouseUp(e);
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('mouseup', this.boundMouseUp, true);
    
    // Start drag after a short delay (300ms for better press-and-hold feel)
    this.dragStartTimer = setTimeout(() => {
      target.classList.remove('press-hold');
      this.startDraggingMouse(event, target);
    }, 300);
  }
  
  onPieceTouchStart(event: TouchEvent, piece: DraggablePiece) {
    if (this.phase !== 'playing') {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    
    this.draggedPiece = piece;
    this.dragStarted = false;
    this.mouseDownPosition = { x: touch.clientX, y: touch.clientY };
    
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      return;
    }
    
    // Add visual feedback for press-and-hold
    target.classList.add('press-hold');
    
    // Create bound functions for proper cleanup
    this.boundTouchMove = (e: TouchEvent) => this.onTouchMove(e);
    this.boundTouchEnd = (e: TouchEvent) => this.onTouchEnd(e);
    
    // Add global touch event listeners
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', this.boundTouchEnd, true);
    
    // Start drag after a short delay (300ms for better press-and-hold feel)
    this.dragStartTimer = setTimeout(() => {
      target.classList.remove('press-hold');
      this.startDraggingTouch(touch, target);
    }, 300);
  }
  
  startDraggingMouse(event: MouseEvent, target: HTMLElement) {
    if (!this.draggedPiece) {
      return;
    }
    
    this.isDragging = true;
    this.dragStarted = true;
    
    this.draggedElement = target.cloneNode(true) as HTMLElement;
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.style.zIndex = '10000';
    this.draggedElement.style.opacity = '0.8';
    this.draggedElement.style.transform = 'scale(1.2)';
    this.draggedElement.style.cursor = 'grabbing';
    
    // Ensure all child elements also ignore pointer events
    const allChildren = this.draggedElement.querySelectorAll('*');
    allChildren.forEach(child => {
      (child as HTMLElement).style.pointerEvents = 'none';
    });
    
    const rect = target.getBoundingClientRect();
    this.dragOffset.x = this.mouseDownPosition.x - rect.left;
    this.dragOffset.y = this.mouseDownPosition.y - rect.top;
    
    this.draggedElement.style.left = (this.mouseDownPosition.x - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (this.mouseDownPosition.y - this.dragOffset.y) + 'px';
    this.draggedElement.style.width = rect.width + 'px';
    this.draggedElement.style.height = rect.height + 'px';
    
    document.body.appendChild(this.draggedElement);
    
    target.style.opacity = '0.5';
  }
  
  startDraggingTouch(touch: Touch, target: HTMLElement) {
    if (!this.draggedPiece) {
      return;
    }
    
    this.isDragging = true;
    this.dragStarted = true;
    
    this.draggedElement = target.cloneNode(true) as HTMLElement;
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.style.zIndex = '10000';
    this.draggedElement.style.opacity = '0.8';
    this.draggedElement.style.transform = 'scale(1.2)';
    this.draggedElement.style.cursor = 'grabbing';
    
    // Ensure all child elements also ignore pointer events
    const allChildren = this.draggedElement.querySelectorAll('*');
    allChildren.forEach(child => {
      (child as HTMLElement).style.pointerEvents = 'none';
    });
    
    const rect = target.getBoundingClientRect();
    this.dragOffset.x = touch.clientX - rect.left;
    this.dragOffset.y = touch.clientY - rect.top;
    
    this.draggedElement.style.left = (touch.clientX - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (touch.clientY - this.dragOffset.y) + 'px';
    this.draggedElement.style.width = rect.width + 'px';
    this.draggedElement.style.height = rect.height + 'px';
    
    document.body.appendChild(this.draggedElement);
    
    target.style.opacity = '0.5';
  }

  onMouseMove(event: MouseEvent) {
    // If dragging hasn't started yet, check if mouse moved too far (cancel drag)
    if (!this.isDragging && this.draggedPiece) {
      const distance = Math.sqrt(
        Math.pow(event.clientX - this.mouseDownPosition.x, 2) +
        Math.pow(event.clientY - this.mouseDownPosition.y, 2)
      );
      
      // If moved more than 10px before drag started, cancel the drag
      if (distance > 10) {
        this.cancelDrag();
      }
      return;
    }
    
    if (!this.isDragging || !this.draggedElement) {
      return;
    }
    
    event.preventDefault();
    
    this.draggedElement.style.left = (event.clientX - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (event.clientY - this.dragOffset.y) + 'px';
    
    // Check which drop zone we're over using coordinates
    const dropZones = document.querySelectorAll<HTMLElement>('.drop-zone');
    let foundZone: HTMLElement | null = null;
    
    dropZones.forEach((zone: HTMLElement) => {
      const rect = zone.getBoundingClientRect();
      if (event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        foundZone = zone;
      }
    });
    
    // Only update if we moved to a different drop zone
    if (foundZone !== this.currentDropZone) {
      // Remove drag-over from previous zone
      if (this.currentDropZone) {
        this.currentDropZone.classList.remove('drag-over');
      }
      
      // Add drag-over to new zone
      if (foundZone !== null) {
        (foundZone as HTMLElement).classList.add('drag-over');
      }
      
      this.currentDropZone = foundZone;
    }
  }
  
  onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    
    // If dragging hasn't started yet, check if touch moved too far (cancel drag)
    if (!this.isDragging && this.draggedPiece) {
      const distance = Math.sqrt(
        Math.pow(touch.clientX - this.mouseDownPosition.x, 2) +
        Math.pow(touch.clientY - this.mouseDownPosition.y, 2)
      );
      
      // If moved more than 10px before drag started, cancel the drag
      if (distance > 10) {
        this.cancelDrag();
      }
      return;
    }
    
    if (!this.isDragging || !this.draggedElement) {
      return;
    }
    
    event.preventDefault();
    
    this.draggedElement.style.left = (touch.clientX - this.dragOffset.x) + 'px';
    this.draggedElement.style.top = (touch.clientY - this.dragOffset.y) + 'px';
    
    // Check which drop zone we're over using coordinates
    const dropZones = document.querySelectorAll<HTMLElement>('.drop-zone');
    let foundZone: HTMLElement | null = null;
    
    dropZones.forEach((zone: HTMLElement) => {
      const rect = zone.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        foundZone = zone;
      }
    });
    
    // Only update if we moved to a different drop zone
    if (foundZone !== this.currentDropZone) {
      // Remove drag-over from previous zone
      if (this.currentDropZone) {
        this.currentDropZone.classList.remove('drag-over');
      }
      
      // Add drag-over to new zone
      if (foundZone !== null) {
        (foundZone as HTMLElement).classList.add('drag-over');
      }
      
      this.currentDropZone = foundZone;
    }
  }
  
  cancelDrag() {
    // Clear the drag start timer
    if (this.dragStartTimer) {
      clearTimeout(this.dragStartTimer);
      this.dragStartTimer = null;
    }
    
    // Remove press-hold class from all pieces
    document.querySelectorAll('.draggable-piece.press-hold').forEach(el => {
      el.classList.remove('press-hold');
    });
    
    // Remove listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove, true);
      this.boundMouseMove = null;
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp, true);
      this.boundMouseUp = null;
    }
    if (this.boundTouchMove) {
      document.removeEventListener('touchmove', this.boundTouchMove, true);
      this.boundTouchMove = null;
    }
    if (this.boundTouchEnd) {
      document.removeEventListener('touchend', this.boundTouchEnd, true);
      this.boundTouchEnd = null;
    }
    
    // Reset state
    this.draggedPiece = null;
    this.dragStarted = false;
    this.isDragging = false;
  }

  onMouseUp(event: MouseEvent) {
    event.preventDefault();
    
    // Clear the drag start timer if it hasn't fired yet
    if (this.dragStartTimer) {
      clearTimeout(this.dragStartTimer);
      this.dragStartTimer = null;
    }
    
    // Remove press-hold class from all pieces
    document.querySelectorAll('.draggable-piece.press-hold').forEach(el => {
      el.classList.remove('press-hold');
    });
    
    // Remove global listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove, true);
      this.boundMouseMove = null;
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp, true);
      this.boundMouseUp = null;
    }
    
    // If drag never started, just reset and return
    if (!this.dragStarted || !this.isDragging) {
      this.draggedPiece = null;
      this.dragStarted = false;
      this.isDragging = false;
      return;
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
    
    // Find the drop zone we're over using coordinates
    if (this.draggedPiece) {
      const dropZones = document.querySelectorAll<HTMLElement>('.drop-zone');
      let dropZone: HTMLElement | null = null;
      
      dropZones.forEach((zone: HTMLElement) => {
        const rect = zone.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          dropZone = zone;
        }
      });
      
      if (dropZone !== null) {
        const zone = dropZone as HTMLElement;
        zone.classList.remove('drag-over');
        
        const row = parseInt(zone.getAttribute('data-row') || '0');
        const col = parseInt(zone.getAttribute('data-col') || '0');
        
        // Place the piece (allow replacing existing pieces)
        this.userGrid[row][col].color = this.draggedPiece.color;
        this.userGrid[row][col].isPlaced = true;
        
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
    
    // Remove drag-over classes
    if (this.currentDropZone) {
      this.currentDropZone.classList.remove('drag-over');
      this.currentDropZone = null;
    }
    
    // Reset state
    this.isDragging = false;
    this.draggedPiece = null;
    this.dragStarted = false;
  }
  
  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    
    // Clear the drag start timer if it hasn't fired yet
    if (this.dragStartTimer) {
      clearTimeout(this.dragStartTimer);
      this.dragStartTimer = null;
    }
    
    // Remove press-hold class from all pieces
    document.querySelectorAll('.draggable-piece.press-hold').forEach(el => {
      el.classList.remove('press-hold');
    });
    
    // Remove global listeners
    if (this.boundTouchMove) {
      document.removeEventListener('touchmove', this.boundTouchMove, true);
      this.boundTouchMove = null;
    }
    if (this.boundTouchEnd) {
      document.removeEventListener('touchend', this.boundTouchEnd, true);
      this.boundTouchEnd = null;
    }
    
    // If drag never started, just reset and return
    if (!this.dragStarted || !this.isDragging) {
      this.draggedPiece = null;
      this.dragStarted = false;
      this.isDragging = false;
      return;
    }
    
    // Get the last touch position
    const touch = event.changedTouches[0];
    if (!touch) {
      this.cancelDrag();
      return;
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
    
    // Find the drop zone we're over using coordinates
    if (this.draggedPiece) {
      const dropZones = document.querySelectorAll<HTMLElement>('.drop-zone');
      let dropZone: HTMLElement | null = null;
      
      dropZones.forEach((zone: HTMLElement) => {
        const rect = zone.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          dropZone = zone;
        }
      });
      
      if (dropZone !== null) {
        const zone = dropZone as HTMLElement;
        zone.classList.remove('drag-over');
        
        const row = parseInt(zone.getAttribute('data-row') || '0');
        const col = parseInt(zone.getAttribute('data-col') || '0');
        
        // Place the piece (allow replacing existing pieces)
        this.userGrid[row][col].color = this.draggedPiece.color;
        this.userGrid[row][col].isPlaced = true;
        
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
    
    // Remove drag-over classes
    if (this.currentDropZone) {
      this.currentDropZone.classList.remove('drag-over');
      this.currentDropZone = null;
    }
    
    // Reset state
    this.isDragging = false;
    this.draggedPiece = null;
    this.dragStarted = false;
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
    if (target && target.classList.contains('drop-zone')) {
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
    
    if (!pieceToPlace || this.phase !== 'playing') {
      return;
    }
    
    // Place the piece (allow replacing existing pieces)
    this.userGrid[row][col].color = pieceToPlace.color;
    this.userGrid[row][col].isPlaced = true;
    
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
    
    // Clear the cell
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
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.userGrid[row][col].color === this.patternGrid[row][col].color) {
          matches++;
        }
      }
    }
    
    const totalCells = this.gridRows * this.gridCols;
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
    // Store completion in data service
    const completion = {
      date: new Date().toISOString().split('T')[0],
      exerciseId: 'memory',
      level: this.level,
      durationSec: durationSec,
      score: this.score
    };
    this.dataService.addCompletion(completion);
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

