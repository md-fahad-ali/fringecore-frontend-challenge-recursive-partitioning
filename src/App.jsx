import React from 'react';
import { observer } from 'mobx-react-lite';
import Partition from './components/Partition';
import { partitionStore } from './store/PartitionStore';

const App = observer(() => {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Partition 
        partition={partitionStore.rootPartition} 
        width={window.innerWidth} 
        height={window.innerHeight} 
      />
    </div>
  );
});

export default App;
