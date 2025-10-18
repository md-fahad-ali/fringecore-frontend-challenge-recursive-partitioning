import React, { useState, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { partitionStore, Partition as PartitionType } from '../store/PartitionStore';

interface PartitionProps {
  partition: PartitionType;
  width: number;
  height: number;
}

const Partition: React.FC<PartitionProps> = observer(({ partition, width, height }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentRatio, setCurrentRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSplit = (direction: 'horizontal' | 'vertical') => {
    partitionStore.splitPartition(partition.id, direction);
  };

  const handleRemove = () => {
    partitionStore.removePartition(partition.id);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!partition.children) return;
    
    setIsDragging(true);
    setCurrentRatio(partition.splitRatio || 0.5);
    e.preventDefault();
  }, [partition.children, partition.splitRatio]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !partition.children || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newRatio: number;
    const minSize = 150; 

    if (partition.splitDirection === 'vertical') {
      const relativeX = e.clientX - rect.left;
      newRatio = relativeX / rect.width;
      
      
      const minRatio = minSize / rect.width;
      const maxRatio = (rect.width - minSize) / rect.width;
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    } else {
      const relativeY = e.clientY - rect.top;
      newRatio = relativeY / rect.height;
      
      
      const minRatio = minSize / rect.height;
      const maxRatio = (rect.height - minSize) / rect.height;
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    }

    
    const snapPoints = [0.25, 0.5, 0.75];
    const snapThreshold = 0.05;
    const minRatio = partition.splitDirection === 'vertical' 
      ? minSize / rect.width 
      : minSize / rect.height;
    const maxRatio = 1 - minRatio;
    
    for (const point of snapPoints) {
      if (Math.abs(newRatio - point) < snapThreshold && 
          point >= minRatio && point <= maxRatio) {
        newRatio = point;
        break;
      }
    }

    setCurrentRatio(newRatio);
    partitionStore.updateSplitRatio(partition.id, newRatio);
  }, [isDragging, partition.children, partition.splitDirection, partition.id]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setCurrentRatio(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (partition.children) {
    const [child1, child2] = partition.children;
    const ratio = partition.splitRatio || 0.5;
    const isVertical = partition.splitDirection === 'vertical';

    const child1Size = isVertical 
      ? { width: width * ratio, height } 
      : { width, height: height * ratio };
    
    const child2Size = isVertical 
      ? { width: width * (1 - ratio), height } 
      : { width, height: height * (1 - ratio) };

    
    const getFractionDisplay = (ratio: number) => {
      if (Math.abs(ratio - 0.25) < 0.02) return '1/4';
      if (Math.abs(ratio - 0.5) < 0.02) return '1/2';
      if (Math.abs(ratio - 0.75) < 0.02) return '3/4';
      return `${Math.round(ratio * 100)}%`;
    };

    return (
      <div 
        ref={containerRef}
        className={`relative ${isVertical ? 'flex flex-row' : 'flex flex-col'}`}
        style={{ width, height }}
      >
        <Partition partition={child1} {...child1Size} />
        
        {/* Resize handle */}
        <div
          className={`absolute bg-gray-500 hover:bg-gray-700 cursor-${isVertical ? 'col' : 'row'}-resize z-0 transition-colors ${
            isVertical 
              ? 'w-2 h-full top-0' 
              : 'h-2 w-full left-0'
          }`}
          style={isVertical 
            ? { left: `${ratio * 100}%`, transform: 'translateX(-50%)' }
            : { top: `${ratio * 100}%`, transform: 'translateY(-50%)' }
          }
          onMouseDown={handleMouseDown}
        />

        
        {isDragging && currentRatio !== null && (
          <div
            className="absolute z-30 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-mono pointer-events-none"
            style={isVertical 
              ? { 
                  left: `${currentRatio * 100}%`, 
                  top: '50%',
                  transform: 'translate(-50%, -50%)' 
                }
              : { 
                  top: `${currentRatio * 100}%`, 
                  left: '50%',
                  transform: 'translate(-50%, -50%)' 
                }
            }
          >
            {getFractionDisplay(currentRatio)}
          </div>
        )}
        
        <Partition partition={child2} {...child2Size} />
      </div>
    );
  }

  
  const isSmall = width < 150 || height < 100;
  
  return (
    <div
      className="relative flex items-center justify-center border border-gray-300"
      style={{ 
        width, 
        height, 
        backgroundColor: partition.color,
        minWidth: '150px',
        minHeight: '100px'
      }}
    >
      
      <div 
        className={`flex gap-1 bg-white bg-opacity-90 rounded shadow-sm relative z-50 ${
          isSmall ? 'px-1 py-0.5' : 'px-2 py-1'
        }`}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSplit('vertical');
          }}
          className={`text-white rounded hover:bg-blue-600 transition-colors bg-blue-500 relative z-50 ${
            isSmall ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'
          }`}
          title="Split Vertically"
        >
          V
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSplit('horizontal');
          }}
          className={`text-white rounded hover:bg-green-600 transition-colors bg-green-500 relative z-50 ${
            isSmall ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'
          }`}
          title="Split Horizontally"
        >
          H
        </button>
        {partitionStore.hasMultiplePartitions() && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleRemove();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className={`text-white rounded hover:bg-red-600 transition-colors bg-red-500 relative z-50 ${
              isSmall ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'
            }`}
            title="Remove Partition"
            style={{ pointerEvents: 'auto' }}
          >
            -
          </button>
        )}
      </div>
    </div>
  );
});

export default Partition;
