import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import gemsData from '../data/gems.json';
import { EQUIPMENT } from '../data/equipment.js';

const TABS = [
  { id: 'minerals', label: 'Raw Minerals', icon: '🪨' },
  { id: 'gems', label: 'Gems', icon: '💎' },
  { id: 'equipment', label: 'Equipment', icon: '🔧' },
  { id: 'currency', label: 'Currency', icon: '💰' }
];

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'value', label: 'Value' },
  { id: 'quantity', label: 'Quantity' }
];

export default function Inventory() {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState('minerals');
  const [sortBy, setSortBy] = useState('name');
  const [filter, setFilter] = useState('');
  
  const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  const inventory = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  
  const items = useMemo(() => {
    if (activeTab === 'currency') {
      return [{
        id: 'currency',
        name: 'Currency',
        quantity: 1,
        coins: state.player.coins,
        shiftPoints: state.player.shiftPoints || 0
      }];
    }
    
    if (activeTab === 'equipment') {
      return Object.values(EQUIPMENT).map(eq => {
        const noneEquipmentOwned = eq.id === 'NONE' && playerLevel >= eq.unlockLevel;
        const isOwned = inventory.equipment?.includes(eq.id) || noneEquipmentOwned;
        return {
          id: eq.id,
          name: eq.name,
          quantity: 1,
          owned: isOwned,
          unlockLevel: eq.unlockLevel,
          cost: eq.cost
        };
      });
    }
    
    const invItems = inventory[activeTab] || [];
    return invItems.map(invItem => {
      const gemData = gemsData.gems.find(g => g.id === invItem.gemId);
      return {
        ...invItem,
        name: gemData?.name || invItem.gemId,
        value: gemData?.value || 0,
        hardness: gemData?.hardness || 0,
        type: gemData?.type || 'unknown'
      };
    });
  }, [activeTab, inventory, state.player.coins, state.player.shiftPoints]);
  
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(lower));
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [items, filter, sortBy]);
  
  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: 'MENU' });
  };
  
  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center w-full mb-6">
        <button className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors" onClick={handleBack}>← Back</button>
        <h2 className="text-xl md:text-2xl font-bold text-yellow-400 m-0">INVENTORY</h2>
        <div style={{ width: 80 }} />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6 w-full">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`
              flex items-center gap-1 px-3 md:px-4 py-2 rounded-lg border-2 border-transparent cursor-pointer transition-all
              ${activeTab === tab.id 
                ? 'bg-yellow-400 text-slate-900 border-yellow-400' 
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div className="flex gap-4 mb-6 w-full sm:flex-row flex-col">
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>Sort: {opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 w-full">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No items in {TABS.find(t => t.id === activeTab)?.label}
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`
                bg-slate-800 border-2 border-slate-700 rounded-lg p-3 text-center transition-all hover:border-yellow-400
                ${activeTab === 'equipment' && !item.owned ? 'opacity-50' : ''}
              `}
            >
              <div className="text-3xl mb-2">
                {activeTab === 'currency' ? '💰' : 
                 activeTab === 'equipment' ? '🔧' : '💎'}
              </div>
              <div className="font-semibold mb-1">{item.name}</div>
              {activeTab !== 'equipment' && activeTab !== 'currency' && (
                <>
                  <div className="text-sm text-teal-400">x{item.quantity}</div>
                  <div className="text-xs text-yellow-400">{item.value}💎</div>
                </>
              )}
              {activeTab === 'currency' && (
                <>
                  <div className="text-sm">💎 {item.coins?.toLocaleString()}</div>
                  <div className="text-sm">✨ {item.shiftPoints}</div>
                </>
              )}
              {activeTab === 'equipment' && (
                <div className={`text-xs ${item.owned ? 'text-teal-400' : 'text-gray-400'}`}>
                  {item.owned ? '✓ Owned' : `Level ${item.unlockLevel}`}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
