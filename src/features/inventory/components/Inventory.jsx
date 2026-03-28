import { useState, useMemo } from 'react';
import { useGame, SET_PHASE, GAME_PHASES } from '../../../context/GameContext';
import { useInventory } from '../hooks/useInventory';
import itemsData from '../../../data/items.json';
import { EQUIPMENT } from '../../../data/equipment.js';

const TABS = [
  { id: 'gems', label: 'Gems', icon: '💎' },
  { id: 'minerals', label: 'Minerals', icon: '🪨' },
  { id: 'equipment', label: 'Equipment', icon: '⚔️' }
];

const SORT_OPTIONS = [
  { id: 'quantity', label: 'Quantity' },
  { id: 'value', label: 'Value' }
];

const EMPTY_STATE_MESSAGES = {
  gems: 'No gems collected yet. Explore locations to find precious gems!',
  minerals: 'No minerals in inventory. Mine rocks to collect raw minerals.',
  equipment: 'No equipment owned. Visit the shop to purchase tools.'
};

export default function Inventory() {
  const { state, dispatch } = useGame();
  const { inventory, coins } = useInventory();
  const [activeTab, setActiveTab] = useState('gems');
  const [sortBy, setSortBy] = useState('quantity');
  const [filter, setFilter] = useState('');

  const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  
  const items = useMemo(() => {
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
          cost: eq.cost,
          icon: '⚔️'
        };
      });
    }

    // For gems and minerals tabs, get items from the correct inventory category
    // gems tab shows items with category "Gem", minerals tab shows "Mineral"
    const categoryMap = {
      gems: 'gems',
      minerals: 'minerals'
    };

    const invCategory = categoryMap[activeTab];
    const invItems = inventory[invCategory] || [];

    return invItems.map(invItem => {
      const itemData = itemsData.items.find(item => item.id === invItem.gemId);
      const icon = itemData?.category === 'Gem' ? '💎' : '🪨';
      return {
        id: invItem.gemId,
        gemId: invItem.gemId,
        name: itemData?.name || invItem.gemId,
        quantity: invItem.quantity,
        value: itemData?.value || 0,
        hardness: itemData?.hardness || 0,
        rarity: itemData?.rarity || 'Unknown',
        category: itemData?.category || 'Unknown',
        icon
      };
    });
  }, [activeTab, inventory, playerLevel]);
  
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(lower));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'quantity':
        default:
          return (b.quantity || 0) - (a.quantity || 0);
      }
    });

    return result;
  }, [items, filter, sortBy]);
  
  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
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
          <div className="col-span-full text-center py-12 px-4">
            <div className="text-4xl mb-3">{TABS.find(t => t.id === activeTab)?.icon}</div>
            <p className="text-gray-400 text-sm">{EMPTY_STATE_MESSAGES[activeTab]}</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`
                bg-slate-800 border-2 border-slate-700 rounded-lg p-3 text-center transition-all hover:border-yellow-400 hover:scale-105
                ${activeTab === 'equipment' && !item.owned ? 'opacity-50' : ''}
              `}
            >
              <div className="text-3xl mb-2">
                {item.icon}
              </div>
              <div className="font-semibold mb-1 text-sm">{item.name}</div>
              {activeTab !== 'equipment' && (
                <>
                  <div className="text-sm text-teal-400">x{item.quantity}</div>
                  <div className="text-xs text-yellow-400">{item.value}💎</div>
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
