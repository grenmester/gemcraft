import { useState, useMemo } from 'react';
import { useGame, GAME_PHASES, SET_PHASE, ADD_COINS, SELL_ITEMS } from '../../../context/GameContext';
import { items as ITEMS_DATA } from '../../../loaders/items.js';
import { FaStore, FaArrowLeft, FaGem, FaMountain, FaLayerGroup, FaCubes, FaRing, FaDollarSign } from 'react-icons/fa';

const TABS = [
  { id: 'gems', label: 'Gems', Icon: FaGem },
  { id: 'minerals', label: 'Minerals', Icon: FaMountain },
  { id: 'ores', label: 'Ores', Icon: FaLayerGroup },
  { id: 'metals', label: 'Metals', Icon: FaCubes },
  { id: 'jewelry', label: 'Jewelry', Icon: FaRing }
];

const SELL_MULTIPLIERS = {
  ore: 0.1,
  mineral: 0.2,
  metal: 0.3,
  gem: 0.5,
  processed_gem: 1.0,
  jewelry: 1.0
};

function getSellPrice(item, category, quality) {
  const multiplier = SELL_MULTIPLIERS[category] || 0.5;
  const baseValue = item?.value || 10;
  const qualityFactor = quality ? quality / 100 : 0.5;
  return Math.round(baseValue * multiplier * qualityFactor);
}

export default function Sell() {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState('gems');
  const [selectedItems, setSelectedItems] = useState({});
  const [sellMessage, setSellMessage] = useState(null);

  const inventory = state.player?.inventory || {};

  const items = useMemo(() => {
    const rawMaterials = inventory.rawMaterials || [];
    const processedMaterials = inventory.processedMaterials || [];
    const jewelry = inventory.jewelry || [];

    switch (activeTab) {
      case 'gems': {
        const processed = processedMaterials
          .filter(m => m.category === 'Gem')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: 1,
              quality: item.quality,
              value: item.value || 0,
              category: 'processed_gem',
              sellPrice: getSellPrice(itemData, 'processed_gem', item.quality)
            };
          });
        const raw = rawMaterials
          .filter(m => m.category === 'Gem')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: item.quantity,
              quality: null,
              value: itemData?.value || 0,
              category: 'raw_gem',
              sellPrice: getSellPrice(itemData, 'raw_gem', null)
            };
          });
        return [...processed, ...raw];
      }
      case 'minerals':
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
              category: 'mineral',
              sellPrice: getSellPrice(itemData, 'mineral', null)
            };
          });
      case 'ores':
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
              category: 'ore',
              sellPrice: getSellPrice(itemData, 'ore', null)
            };
          });
      case 'metals':
        return processedMaterials
          .filter(m => m.category === 'Metal')
          .map(item => {
            const itemData = ITEMS_DATA.find(i => i.id === item.id);
            return {
              id: item.id,
              name: itemData?.name || item.id,
              quantity: 1,
              quality: item.quality,
              value: item.value || 0,
              category: 'metal',
              sellPrice: getSellPrice(itemData, 'metal', item.quality)
            };
          });
      case 'jewelry':
        return jewelry.map((item, idx) => ({
          id: item.id || `jewelry-${idx}`,
          name: item.name,
          quantity: 1,
          quality: item.quality,
          value: item.value || 0,
          category: 'jewelry',
          sellPrice: Math.round((item.value || 0) * SELL_MULTIPLIERS.jewelry)
        }));
      default:
        return [];
    }
  }, [activeTab, inventory]);

  const totalValue = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  }, [selectedItems]);

  const totalCoins = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = selectedItems[item.id] || 0;
      return sum + (item.sellPrice * qty);
    }, 0);
  }, [items, selectedItems]);

  const handleSelectItem = (item) => {
    setSelectedItems(prev => {
      const current = prev[item.id] || 0;
      const max = item.quantity;
      const next = current + 1;
      if (next > max) {
        return { ...prev, [item.id]: 0 };
      }
      return { ...prev, [item.id]: next };
    });
  };

  const handleSell = () => {
    if (totalCoins === 0) return;

    const inv = { ...inventory };
    const keyMap = {
      gems: 'processedMaterials',
      minerals: 'rawMaterials',
      ores: 'rawMaterials',
      metals: 'processedMaterials',
      jewelry: 'jewelry'
    };
    const invKey = keyMap[activeTab];
    const invItems = [...(inv[invKey] || [])];

    Object.entries(selectedItems).forEach(([itemId, qty]) => {
      const idx = invItems.findIndex(item => item.id === itemId);
      if (idx >= 0) {
        if (invItems[idx].quantity > qty) {
          invItems[idx] = { ...invItems[idx], quantity: invItems[idx].quantity - qty };
        } else {
          invItems.splice(idx, 1);
        }
      }
    });

    inv[invKey] = invItems;

    dispatch({
      type: SELL_ITEMS,
      payload: { inventory: inv, coins: totalCoins }
    });

    setSelectedItems({});
    setSellMessage({ type: 'success', text: `Sold items for ${totalCoins} coins!` });
    setTimeout(() => setSellMessage(null), 3000);
  };

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <button className="flex items-center gap-2 text-gray-400 hover:text-white" onClick={handleBack}>
          <FaArrowLeft /> Menu
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Sell</h2>
        <div className="text-amber-400 text-sm">Coins: {inventory.coins || 0}</div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItems({}); }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[80px] ${activeTab === tab.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-gray-300'}`}
          >
            <tab.Icon className="text-lg" />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-3 mb-4 text-sm text-gray-400">
        {activeTab === 'ores' && 'Ores sell for 10% of value (raw material)'}
        {activeTab === 'minerals' && 'Minerals sell for 20% of value'}
        {activeTab === 'metals' && 'Metals sell for 30% of value'}
        {activeTab === 'gems' && 'Gems sell for 100% of value'}
        {activeTab === 'jewelry' && 'Jewelry sells for 100% of crafted value'}
      </div>

      {sellMessage && (
        <div className={`mb-4 p-3 rounded-lg text-center font-bold ${sellMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {sellMessage.text}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {activeTab} to sell</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(item => {
              const isSelected = (selectedItems[item.id] || 0) > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${isSelected ? 'bg-green-900/50 border-green-500' : 'bg-slate-800 border-slate-600 hover:border-amber-500'}`}
                >
                  {activeTab === 'jewelry' ? <FaRing className="text-2xl text-cyan-400" /> : <FaGem className="text-2xl text-cyan-400" />}
                  <div className="text-sm text-white text-center">{item.name}</div>
                  <div className="text-xs text-gray-400">x{item.quantity}</div>
                  <div className="text-xs text-amber-400">{item.sellPrice} coins</div>
                  {item.quality && <div className="text-xs text-blue-400">Q:{Math.round(item.quality)}%</div>}
                  {isSelected && <div className="text-xs text-green-400 font-bold">Selected: {selectedItems[item.id]}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-400">Selected: <span className="text-white">{totalValue} items</span></div>
          <div className="text-amber-400 font-bold text-xl">Total: {totalCoins} coins</div>
        </div>
        <button
          onClick={handleSell}
          disabled={totalCoins === 0}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${totalCoins > 0 ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-slate-700 text-gray-500 cursor-not-allowed'}`}
        >
          <FaDollarSign /> Sell Items
        </button>
      </div>
    </div>
  );
}