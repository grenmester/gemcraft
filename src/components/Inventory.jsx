import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import gemsData from '../data/gems.json';
import { EQUIPMENT } from '../data/equipment.js';
import './Inventory.css';

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
      return Object.values(EQUIPMENT).map(eq => ({
        id: eq.id,
        name: eq.name,
        quantity: 1,
        owned: inventory.equipment?.includes(eq.id) || playerLevel >= eq.unlockLevel && eq.id === 'NONE',
        unlockLevel: eq.unlockLevel,
        cost: eq.cost
      }));
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
  }, [activeTab, inventory, state.player.coins, state.player.shiftPoints, playerLevel]);
  
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
    <div className="inventory screen">
      <div className="inventory-header">
        <button className="btn btn-secondary" onClick={handleBack}>← Back</button>
        <h2>INVENTORY</h2>
        <div style={{ width: 80 }} />
      </div>
      
      <div className="inventory-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div className="inventory-controls">
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          className="sort-select"
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
          className="filter-input"
        />
      </div>
      
      <div className="inventory-grid">
        {filteredItems.length === 0 ? (
          <div className="inventory-empty">
            No items in {TABS.find(t => t.id === activeTab)?.label}
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`inventory-item ${activeTab === 'equipment' && !item.owned ? 'locked' : ''}`}>
              <div className="item-icon">
                {activeTab === 'currency' ? '💰' : 
                 activeTab === 'equipment' ? '🔧' : '💎'}
              </div>
              <div className="item-name">{item.name}</div>
              {activeTab !== 'equipment' && activeTab !== 'currency' && (
                <>
                  <div className="item-quantity">x{item.quantity}</div>
                  <div className="item-value">{item.value}💎</div>
                </>
              )}
              {activeTab === 'currency' && (
                <>
                  <div className="item-coins">💎 {item.coins?.toLocaleString()}</div>
                  <div className="item-shift">✨ {item.shiftPoints}</div>
                </>
              )}
              {activeTab === 'equipment' && (
                <div className={`item-status ${item.owned ? 'owned' : ''}`}>
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
