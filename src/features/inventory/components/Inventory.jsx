import { useState, useMemo } from 'react';
import { useGame, SET_PHASE, GAME_PHASES } from '../../../context/GameContext';
import { useInventory } from '../hooks/useInventory';
import { items as ITEMS_DATA } from '../../../loaders/items.js';
import { EQUIPMENT } from '../../../loaders/equipment.js';
import { FaGem, FaMountain, FaShieldAlt, FaBackspace, FaCubes, FaLayerGroup, FaRing } from 'react-icons/fa';

const TABS = [
  { id: 'gems', label: 'Gems', Icon: FaGem },
  { id: 'minerals', label: 'Minerals', Icon: FaMountain },
  { id: 'ores', label: 'Ores', Icon: FaLayerGroup },
  { id: 'metals', label: 'Metals', Icon: FaCubes },
  { id: 'jewelry', label: 'Jewelry', Icon: FaRing },
  { id: 'equipment', label: 'Equipment', Icon: FaShieldAlt }
];

const SORT_OPTIONS = [
  { id: 'quantity', label: 'Quantity' },
  { id: 'value', label: 'Value' }
];

const EMPTY_STATE_MESSAGES = {
  gems: 'No gems collected yet. Explore locations to find precious gems!',
  minerals: 'No minerals in inventory. Mine rocks to collect raw minerals.',
  ores: 'No ores in inventory. Explore higher tier mines to find ore.',
  metals: 'No metals in inventory. Process ores in the Process tab to refine metals.',
  jewelry: 'No jewelry crafted yet. Use the Craft tab to create beautiful jewelry!',
  equipment: 'No equipment owned. Visit the shop to purchase tools.'
};

export default function Inventory() {
  const { state, dispatch } = useGame();
  const { inventory, coins } = useInventory();
  const [activeTab, setActiveTab] = useState('gems');
  const [sortBy, setSortBy] = useState('quantity');
  const [filter, setFilter] = useState('');

const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  
  const getItemsForTab = () => {
    const rawMaterials = inventory.rawMaterials || [];
    const processedMaterials = inventory.processedMaterials || [];
    const jewelry = inventory.jewelry || [];
    
    switch (activeTab) {
      case 'gems': {
        // Include both processed and raw gems
        const processed = processedMaterials.filter(m => m.category === 'Gem').map(item => ({
          id: item.id,
          name: ITEMS_DATA.find(i => i.id === item.id)?.name || item.id,
          quantity: 1,
          quality: item.quality,
          value: item.value || ITEMS_DATA.find(i => i.id === item.id)?.value || 0,
          rarity: ITEMS_DATA.find(i => i.id === item.id)?.rarity || 'Unknown',
          category: 'Gem',
          Icon: FaGem
        }));
        const raw = rawMaterials.filter(m => m.category === 'Gem').map(item => ({
          id: item.id,
          name: ITEMS_DATA.find(i => i.id === item.id)?.name || item.id,
          quantity: item.quantity,
          quality: null,
          value: ITEMS_DATA.find(i => i.id === item.id)?.value || 0,
          rarity: ITEMS_DATA.find(i => i.id === item.id)?.rarity || 'Unknown',
          category: 'Gem',
          Icon: FaGem
        }));
        return [...processed, ...raw];
      }
      case 'minerals':
        // Raw minerals
        return rawMaterials
          .filter(m => m.category === 'Mineral')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: item.quantity,
              quality: null,
              value: itemData?.value || 0,
              rarity: itemData?.rarity || 'Unknown',
              category: 'Mineral',
              Icon: FaMountain
            };
          });
      case 'ores':
        // Raw ore
        return rawMaterials
          .filter(m => m.category === 'Ore')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: item.quantity,
              quality: null,
              value: itemData?.value || 0,
              rarity: itemData?.rarity || 'Unknown',
              category: 'Ore',
              Icon: FaLayerGroup
            };
          });
      case 'metals':
        // Processed metals
        return processedMaterials
          .filter(m => m.category === 'Metal')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: 1,
              quality: item.quality,
              value: item.value || itemData?.value || 0,
              rarity: itemData?.rarity || 'Unknown',
              category: 'Metal',
              Icon: FaCubes
            };
          });
      case 'jewelry':
        return jewelry.map((item, idx) => ({
          id: item.id || `jewelry-${idx}`,
          name: item.name,
          quantity: 1,
          quality: item.quality,
          value: item.value || 0,
          type: item.type,
          Icon: FaRing
        }));
      case 'equipment':
        return Object.values(EQUIPMENT).map(eq => {
          const noneEquipmentOwned = eq.id === 'NONE' && playerLevel >= eq.unlockLevel;
          const isOwned = inventory.equipment?.some(e => e.id === eq.id) || noneEquipmentOwned;
          return {
            id: eq.id,
            name: eq.name,
            quantity: 1,
            owned: isOwned,
            unlockLevel: eq.unlockLevel,
            cost: eq.cost,
            Icon: FaShieldAlt
          };
        });
      default:
        return [];
    }
  };
  
  const items = useMemo(() => getItemsForTab(), [activeTab, inventory, playerLevel]);
  
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
        <button className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors" onClick={handleBack}>
          <FaBackspace className="text-sm" />
          <span>Back</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-yellow-400 m-0">INVENTORY</h2>
        <div style={{ width: 80 }} />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6 w-full">
        {TABS.map(tab => {
          const Icon = tab.Icon;
          return (
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
              <Icon className="text-lg" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
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
            <div className="flex justify-center mb-3">
              {(() => {
                const tab = TABS.find(t => t.id === activeTab);
                const Icon = tab?.Icon;
                return Icon ? <Icon className="text-4xl" /> : null;
              })()}
            </div>
            <p className="text-gray-400 text-sm">{EMPTY_STATE_MESSAGES[activeTab]}</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const ItemIcon = item.Icon;
            // Quality badge color based on quality percentage
            const getQualityColor = (quality) => {
              if (quality === undefined || quality === null) return 'text-gray-500';
              if (quality >= 90) return 'text-yellow-400';
              if (quality >= 75) return 'text-green-400';
              if (quality >= 60) return 'text-blue-400';
              return 'text-gray-400';
            };
            const qualityColor = getQualityColor(item.quality);
            const isUnprocessed = item.quality === undefined || item.quality === null;
            return (
              <div
                key={`${item.id}-${item.quality || 'unprocessed'}`}
                className={`
                  bg-slate-800 border-2 rounded-lg p-3 text-center transition-all hover:border-yellow-400 hover:scale-105
                  ${isUnprocessed ? 'border-slate-700' : 'border-slate-600'}
                  ${activeTab === 'equipment' && !item.owned ? 'opacity-50' : ''}
                `}
              >
                <div className="flex justify-center mb-2">
                  <ItemIcon className="text-3xl text-cyan-400" />
                </div>
                <div className="font-semibold mb-1 text-sm text-white">{item.name}</div>
                {activeTab !== 'equipment' && (
                  <>
                    <div className="text-sm text-teal-400">x{item.quantity}</div>
                    <div className={`text-xs font-medium ${qualityColor}`}>
                      Q: {isUnprocessed ? '?' : `${Math.round(item.quality)}%`}
                    </div>
                    <div className="text-xs text-yellow-400 flex items-center justify-center gap-1">
                      {item.value} <FaGem className="text-xs" />
                    </div>
                  </>
                )}
                {activeTab === 'equipment' && (
                  <div className={`text-xs ${item.owned ? 'text-teal-400' : 'text-gray-400'}`}>
                    {item.owned ? '✓ Owned' : `Level ${item.unlockLevel}`}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
