import { makeAutoObservable } from 'mobx';

export type SplitDirection = 'horizontal' | 'vertical';

export interface Partition {
  id: string;
  color: string;
  children?: [Partition, Partition];
  splitDirection?: SplitDirection;
  splitRatio?: number; 
}

class PartitionStore {
  rootPartition: Partition;

  constructor() {
    makeAutoObservable(this);
    this.rootPartition = {
      id: 'root',
      color: this.generateRandomColor(),
    };
  }

  generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  splitPartition(partitionId: string, direction: SplitDirection): void {
    const partition = this.findPartition(this.rootPartition, partitionId);
    if (partition && !partition.children) {
      const newPartition: Partition = {
        id: `${partitionId}-${Date.now()}`,
        color: this.generateRandomColor(),
      };

      partition.children = [
        { ...partition, id: `${partitionId}-1`, children: undefined },
        newPartition
      ];
      partition.splitDirection = direction;
      partition.splitRatio = 0.5; 
    }
  }

  removePartition(partitionId: string): void {
    if (partitionId === 'root') return; 

    const parent = this.findParent(this.rootPartition, partitionId);
    
    if (parent && parent.children) {
      const siblingIndex = parent.children[0].id === partitionId ? 1 : 0;
      const sibling = parent.children[siblingIndex];
      
      
      parent.color = sibling.color;
      parent.children = sibling.children;
      parent.splitDirection = sibling.splitDirection;
      parent.splitRatio = sibling.splitRatio;
    }
  }

  updateSplitRatio(partitionId: string, ratio: number): void {
    const partition = this.findPartition(this.rootPartition, partitionId);
    if (partition && partition.children) {
      
      partition.splitRatio = Math.max(0.2, Math.min(0.8, ratio));
    }
  }

  private findPartition(partition: Partition, id: string): Partition | null {
    if (partition.id === id) return partition;
    
    if (partition.children) {
      const found = this.findPartition(partition.children[0], id) || 
                   this.findPartition(partition.children[1], id);
      return found;
    }
    
    return null;
  }

  private findParent(partition: Partition, childId: string): Partition | null {
    if (partition.children) {
      if (partition.children[0].id === childId || partition.children[1].id === childId) {
        return partition;
      }
      
      const found = this.findParent(partition.children[0], childId) || 
                   this.findParent(partition.children[1], childId);
      return found;
    }
    
    return null;
  }

  hasMultiplePartitions(): boolean {
    return this.countPartitions(this.rootPartition) > 1;
  }

  private countPartitions(partition: Partition): number {
    if (!partition.children) return 1;
    return this.countPartitions(partition.children[0]) + this.countPartitions(partition.children[1]);
  }
}

export const partitionStore = new PartitionStore();
