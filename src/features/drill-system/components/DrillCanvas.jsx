
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import PlayerNumberMenu from '@/shared/components/PlayerNumberMenu';

const DrillCanvas = forwardRef(({ activeTool, initialElements, onDrop, onDragOver, onElementsChange, isReadOnly }, ref) => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionData, setInteractionData] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null); // Stores ID of the hovered element for number menu
  const [showNumberMenu, setShowNumberMenu] = useState(false);
  const [numberMenuPosition, setNumberMenuPosition] = useState({ x: 0, y: 0 });

  // Update elements when initialElements prop changes
  useEffect(() => {
    console.log('[DrillCanvas] initialElements changed:', initialElements);
    setElements(initialElements || []);
  }, [initialElements]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addShape: (type, clientX, clientY) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const newElement = { 
        id: Date.now(), 
        type, 
        x, 
        y, 
        radius: type === 'cone-yellow' ? 25 : 20,
        number: null
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      onElementsChange?.(newElements);
    },
    clearCanvas: () => {
      setElements([]);
      onElementsChange?.([]);
    },
    getElements: () => elements, // New: Allows parent to get current elements
    setElements: (newElements) => { // Existing: Allows parent to set elements
      setElements(newElements);
    }
  }));

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Adjust for DPR if canvas was scaled
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width / dpr),
      y: (e.clientY - rect.top) * (canvas.height / rect.height / dpr),
    };
  };

  const drawElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw field
    drawSoccerField(ctx, canvas.width, canvas.height);

    // Draw elements
    elements.forEach(el => {
      ctx.save();
      drawElement(ctx, el);
      ctx.restore();
    });

    // Draw temporary interaction
    if (isInteracting && interactionData) {
      ctx.save();
      drawElement(ctx, interactionData);
      ctx.restore();
    }
  }, [elements, isInteracting, interactionData]);
  
  const drawSoccerField = (ctx, width, height) => {
    // Field background
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, width, height);
    
    // Field border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 60, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Center spot
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Goals with posts
    const goalWidth = 80;
    const goalDepth = 25;
    
    // Left goal
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(10 - goalDepth, (height - goalWidth) / 2, goalDepth, goalWidth);
    
    // Right goal
    ctx.strokeRect(width - 10, (height - goalWidth) / 2, goalDepth, goalWidth);

    // Penalty areas
    const penaltyWidth = 160;
    const penaltyDepth = 55;
    
    ctx.lineWidth = 2;
    // Left penalty area
    ctx.strokeRect(10, (height - penaltyWidth) / 2, penaltyDepth, penaltyWidth);
    
    // Right penalty area
    ctx.strokeRect(width - 10 - penaltyDepth, (height - penaltyWidth) / 2, penaltyDepth, penaltyWidth);

    // Goal areas
    const goalAreaWidth = 60;
    const goalAreaDepth = 20;
    
    // Left goal area
    ctx.strokeRect(10, (height - goalAreaWidth) / 2, goalAreaDepth, goalAreaWidth);
    
    // Right goal area
    ctx.strokeRect(width - 10 - goalAreaDepth, (height - goalAreaWidth) / 2, goalAreaDepth, goalAreaWidth);

    // Penalty spots
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10 + 35, height / 2, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 10 - 35, height / 2, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Corner arcs
    const cornerRadius = 8;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Top left
    ctx.beginPath();
    ctx.arc(10, 10, cornerRadius, 0, Math.PI / 2);
    ctx.stroke();
    
    // Top right
    ctx.beginPath();
    ctx.arc(width - 10, 10, cornerRadius, Math.PI / 2, Math.PI);
    ctx.stroke();
    
    // Bottom left
    ctx.beginPath();
    ctx.arc(10, height - 10, cornerRadius, -Math.PI / 2, 0);
    ctx.stroke();
    
    // Bottom right
    ctx.beginPath();
    ctx.arc(width - 10, height - 10, cornerRadius, Math.PI, 3 * Math.PI / 2);
    ctx.stroke();
  };

  const drawElement = (ctx, el) => {
    switch (el.type) {
      case 'player-blue':
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw number if exists
        if (el.number) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.number, el.x, el.y);
        }
        break;
        
      case 'opponent-red':
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw number if exists
        if (el.number) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.number, el.x, el.y);
        }
        break;
        
      case 'cone-yellow':
        // Draw cone as triangle (bigger)
        ctx.beginPath();
        ctx.moveTo(el.x, el.y - el.radius);
        ctx.lineTo(el.x - el.radius * 0.7, el.y + el.radius * 0.7);
        ctx.lineTo(el.x + el.radius * 0.7, el.y + el.radius * 0.7);
        ctx.closePath();
        ctx.fillStyle = '#eab308';
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
        
      case 'ball':
        // Draw a simple soccer ball - white circle with black pentagons and curved lines
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw pentagon pattern (center)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        const pentagonSize = el.radius * 0.35; // Adjust size for better visual
        const angleOffset = -Math.PI / 2; // Start from top
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 + angleOffset;
          const x = el.x + Math.cos(angle) * pentagonSize;
          const y = el.y + Math.sin(angle) * pentagonSize;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        
        // Add some curved lines for the soccer ball pattern (simplified)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        
        // Lines radiating from the center pentagon's corners
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 + angleOffset;
          const xStart = el.x + Math.cos(angle) * pentagonSize;
          const yStart = el.y + Math.sin(angle) * pentagonSize;
          const xEnd = el.x + Math.cos(angle) * el.radius;
          const yEnd = el.y + Math.sin(angle) * el.radius;
          
          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          // Draw a curved line to the edge
          // The control point could be adjusted for different curve shapes
          const midX = (xStart + xEnd) / 2;
          const midY = (yStart + yEnd) / 2;
          const controlPointX = midX + Math.cos(angle + Math.PI/2) * (el.radius * 0.1); // Offset perpendicular to the line
          const controlPointY = midY + Math.sin(angle + Math.PI/2) * (el.radius * 0.1);
          // ctx.quadraticCurveTo(controlPointX, controlPointY, xEnd, yEnd); // For a single curve
          ctx.lineTo(xEnd, yEnd); // Simplified to straight lines if curves are too complex for simple representation
          ctx.stroke();
        }
        
        break;
        
      case 'goal':
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(el.x - 25, el.y - 15, 50, 30);
        break;
        
      case 'pass-arrow':
        if (el.points && el.points.length >= 2) {
          drawArrow(ctx, el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, false);
        }
        break;
        
      case 'dribble-arrow':
        if (el.points && el.points.length >= 2) {
          drawFreehand(ctx, el.points, true);
        }
        break;

      case 'shoot-arrow':
        if (el.points && el.points.length >= 2) {
          drawDoubleArrow(ctx, el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y);
        }
        break;
    }
  };

  const drawArrow = (ctx, fromx, fromy, tox, toy, dashed) => {
    const headlen = 12;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    
    if (dashed) {
      ctx.setLineDash([8, 8]);
    } else {
      ctx.setLineDash([]);
    }
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawDoubleArrow = (ctx, fromx, fromy, tox, toy) => {
    const headlen = 12;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    const lineOffset = 4; // Distance between the two parallel lines
    
    // Calculate perpendicular offset
    const perpX = -Math.sin(angle) * lineOffset;
    const perpY = Math.cos(angle) * lineOffset;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    
    // Draw first line (offset up)
    ctx.beginPath();
    ctx.moveTo(fromx + perpX, fromy + perpY);
    ctx.lineTo(tox + perpX, toy + perpY);
    ctx.stroke();
    
    // Draw second line (offset down)
    ctx.beginPath();
    ctx.moveTo(fromx - perpX, fromy - perpY);
    ctx.lineTo(tox - perpX, toy - perpY);
    ctx.stroke();
    
    // Draw arrowhead at the end (centered)
    // The arrow head should ideally stem from the average of the two lines' end points
    const arrowHeadX = tox;
    const arrowHeadY = toy;

    ctx.beginPath();
    ctx.moveTo(arrowHeadX, arrowHeadY);
    ctx.lineTo(arrowHeadX - headlen * Math.cos(angle - Math.PI / 6), arrowHeadY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(arrowHeadX, arrowHeadY);
    ctx.lineTo(arrowHeadX - headlen * Math.cos(angle + Math.PI / 6), arrowHeadY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };
  
  const drawFreehand = (ctx, points, dashed) => {
    if (points.length < 2) return;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    
    if (dashed) {
      ctx.setLineDash([8, 8]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Draw arrowhead at the end
    if (points.length >= 2) {
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
      const headlen = 12;
      const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);
      
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - headlen * Math.cos(angle - Math.PI / 6), last.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - headlen * Math.cos(angle + Math.PI / 6), last.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  const findElementAtPos = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      // Check for arrows first as they don't have a radius
      if (el.type === 'pass-arrow' || el.type === 'dribble-arrow' || el.type === 'shoot-arrow') {
        // For line-based elements, check if click is near the line segment(s)
        // This is a simplified check and might need more robust geometry for accuracy
        if (el.points && el.points.length >= 2) {
            // Check near the start or end point for simplicity of deletion click area
            const startDist = Math.sqrt((x - el.points[0].x) ** 2 + (y - el.points[0].y) ** 2);
            const endDist = Math.sqrt((x - el.points[el.points.length - 1].x) ** 2 + (y - el.points[el.points.length - 1].y) ** 2);
            const tolerance = 15; // pixels
            if (startDist <= tolerance || endDist <= tolerance) {
                return el;
            }
        }
      } else if (el.radius) {
        const dist = Math.sqrt((x - el.x) ** 2 + (y - el.y) ** 2);
        if (dist <= el.radius) return el;
      } else if (el.type === 'goal') { // Check for goal rectangle
        // Assuming goal is 50x30 centered at el.x, el.y
        const halfWidth = 25;
        const halfHeight = 15;
        if (x >= el.x - halfWidth && x <= el.x + halfWidth &&
            y >= el.y - halfHeight && y <= el.y + halfHeight) {
            return el;
        }
      }
    }
    return null;
  };

  const deleteElement = (elementToDelete) => {
    const newElements = elements.filter(el => el.id !== elementToDelete.id);
    setElements(newElements);
    onElementsChange?.(newElements);
  };

  // Handle click events for showing number menu
  const handleClick = (e) => {
    if (isReadOnly) return; // Prevent interaction in read-only mode

    const pos = getMousePos(e);
    const clickedElement = findElementAtPos(pos.x, pos.y);
    
    // Close number menu if clicking elsewhere or on a non-player element
    if (!clickedElement || !['player-blue', 'opponent-red'].includes(clickedElement.type)) {
      setShowNumberMenu(false);
      setHoveredElement(null); // Clear hoveredElement
      return;
    }
    
    // Show number menu for players
    if (['player-blue', 'opponent-red'].includes(clickedElement.type)) {
      setHoveredElement(clickedElement.id); // Store the ID of the clicked element
      setNumberMenuPosition({ x: e.clientX, y: e.clientY });
      setShowNumberMenu(true);
    }
  };

  const handleMouseDown = (e) => {
    if (isReadOnly) return; // Prevent interaction in read-only mode
    // Don't interfere with number menu
    if (showNumberMenu) return;
    
    const pos = getMousePos(e);
    const clickedElement = findElementAtPos(pos.x, pos.y);
    
    if (activeTool === 'delete' && clickedElement) {
      deleteElement(clickedElement);
      return;
    }
    
    setIsInteracting(true);
    
    if (activeTool === 'select') {
      if (clickedElement) {
        setInteractionData({ ...clickedElement, offsetX: pos.x - clickedElement.x, offsetY: pos.y - clickedElement.y });
      }
    } else if (activeTool === 'pass-arrow') {
      setInteractionData({ type: 'pass-arrow', points: [pos, pos] });
    } else if (activeTool === 'dribble-arrow') {
      setInteractionData({ type: 'dribble-arrow', points: [pos] });
    } else if (activeTool === 'shoot-arrow') {
      setInteractionData({ type: 'shoot-arrow', points: [pos, pos] });
    }
  };

  const handleMouseMove = (e) => {
    if (isReadOnly) return; // Prevent interaction in read-only mode
    if (!isInteracting) return;
    
    const pos = getMousePos(e);
    
    if (activeTool === 'select' && interactionData) {
      setInteractionData(prev => ({ ...prev, x: pos.x - prev.offsetX, y: pos.y - prev.offsetY }));
    } else if (activeTool === 'pass-arrow' && interactionData) {
      setInteractionData(prev => ({ ...prev, points: [prev.points[0], pos] }));
    } else if (activeTool === 'dribble-arrow' && interactionData) {
      setInteractionData(prev => ({ ...prev, points: [...prev.points, pos] }));
    } else if (activeTool === 'shoot-arrow' && interactionData) {
      setInteractionData(prev => ({ ...prev, points: [prev.points[0], pos] }));
    }
  };

  const handleMouseUp = () => {
    if (isReadOnly) return; // Prevent interaction in read-only mode
    if (!isInteracting) return; // Only process if interaction started

    if (interactionData) {
      if (activeTool === 'select') {
        const newElements = elements.map(el => el.id === interactionData.id ? { ...el, x: interactionData.x, y: interactionData.y } : el);
        setElements(newElements);
        onElementsChange?.(newElements);
      } else {
        // For arrows, check if the start and end points are distinct enough to create an arrow
        if ((interactionData.type === 'pass-arrow' || interactionData.type === 'shoot-arrow') && 
            interactionData.points && 
            interactionData.points.length === 2 && 
            interactionData.points[0].x === interactionData.points[1].x && 
            interactionData.points[0].y === interactionData.points[1].y) {
          // If start and end points are the same, don't add the arrow
          // Do nothing
        } else if (interactionData.type === 'dribble-arrow' && 
                   interactionData.points && 
                   interactionData.points.length < 2) {
          // If dribble-arrow has less than 2 points, don't add it
          // Do nothing
        } else {
          const newElement = { id: Date.now(), ...interactionData };
          const newElements = [...elements, newElement];
          setElements(newElements);
          onElementsChange?.(newElements);
        }
      }
    }
    setIsInteracting(false);
    setInteractionData(null);
  };

  const handleMouseLeave = () => {
    if (isReadOnly) return; // Prevent interaction in read-only mode
    handleMouseUp(); // End any ongoing interaction
  };

  const handleDropInternal = (e) => {
    if (isReadOnly) return; // Prevent interaction in read-only mode
    onDrop(e); // Call the onDrop prop passed from the parent
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // Set canvas dimensions considering device pixel ratio for sharp rendering
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr); // Scale the context to match the DPR
      drawElements();
    };
    
    resizeCanvas(); // Initial resize and draw
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawElements]);

  useEffect(() => {
    console.log('[DrillCanvas] Drawing elements:', elements.length, 'elements');
    drawElements(); // Redraw whenever elements or interactionData change
  }, [elements, interactionData, drawElements]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDrop={handleDropInternal} // Canvas now handles drops directly
        onDragOver={onDragOver} // Canvas now handles drag over directly
        className="w-full h-full"
        style={{ cursor: isReadOnly ? 'default' : (activeTool === 'delete' ? 'not-allowed' : activeTool === 'select' ? 'default' : 'crosshair') }}
      />
      
      {showNumberMenu && hoveredElement && ( // hoveredElement is the ID
        <PlayerNumberMenu
          position={numberMenuPosition}
          onSelectNumber={(number) => {
            if (isReadOnly) return; // Prevent interaction in read-only mode
            const element = elements.find(el => el.id === hoveredElement); // Find the element by its ID
            if (element) {
              const updatedElements = elements.map(el =>
                el.id === hoveredElement ? { ...el, number } : el
              );
              setElements(updatedElements);
              onElementsChange?.(updatedElements);
            }
            setShowNumberMenu(false);
            setHoveredElement(null);
          }}
          onClose={() => {
            setShowNumberMenu(false);
            setHoveredElement(null); // Clear hoveredElement on close
          }}
        />
      )}
    </div>
  );
});

export default DrillCanvas;
