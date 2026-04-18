import { useState, useMemo, useEffect } from 'react';
import { useGame, GAME_PHASES, SET_PHASE, CLEAR_NEW_DISCOVERED } from '../../../context/GameContext';
import { getItems } from '../../../data/items';
import { FaSearch, FaArrowLeft, FaMapMarkedAlt } from 'react-icons/fa';
import { GemIcon, MineralIcon, MetalIcon } from '../../../shared/components/ItemIcons';

const RARITY_CONFIG = {
  Common: { color: 'bg-gray-400', label: 'Common' },
  Uncommon: { color: 'bg-green-500', label: 'Uncommon' },
  Rare: { color: 'bg-blue-500', label: 'Rare' },
  Epic: { color: 'bg-purple-500', label: 'Epic' },
  Legendary: { color: 'bg-amber-500', label: 'Legendary' },
};

const ITEM_FACTS = {
  diamond: 'April\'s birthstone. The hardest natural material on Earth, formed under extreme pressure.',
  blue_diamond: 'Among the rarest diamonds. The blue color comes from boron impurities.',
  ruby: 'July\'s birthstone. The finest color is called "pigeon blood" red.',
  sapphire: 'September\'s birthstone. Comes in every color except red (that\'s ruby).',
  emerald: 'May\'s birthstone. Most emeralds have inclusions called "jardin" (garden).',
  alexandrite: 'Color changes from green (daylight) to red (incandescent light).',
  jadeite: 'The most precious form of jade. Imperial jade is the most valuable.',
  taaffeite: 'One of the rarest gemstones. First discovered already cut in a jewelry shop.',
  musgravite: 'Extremely rare, named after the Musgrave Ranges in Australia.',
  red_beryl: 'Also called "bixbite". Found primarily in the Wah Wah Mountains of Utah.',
  tanzanite: 'Discovered in 1967. Found only in Tanzania, one source worldwide.',
  paraiba_tourmaline: 'Known for vivid blue-green colors from copper content.',
  spinel: 'Often mistaken for ruby in historical royal jewelry.',
  tsavorite: 'A green garnet discovered in 1967 in East Africa.',
  black_opal: 'The most valuable opal, showing play of color against a dark background.',
  opal: 'October\'s birthstone. Contains up to 20% water.',
  aquamarine: 'March\'s birthstone. Name means "seawater" in Latin.',
  tourmaline: 'Comes in more colors than any other gemstone.',
  imperial_topaz: 'The most valuable topaz, with precious golden-orange color.',
  peridot: 'August\'s birthstone. One of the few gems that comes in only one color.',
  turquoise: 'One of the oldest known gemstones, used in ancient Egypt.',
  citrine: 'November\'s birthstone. Most citrine is heat-treated amethyst.',
  amethyst: 'February\'s birthstone. Purple color comes from iron and irradiation.',
  natural_pearl: 'June\'s birthstone. Formed naturally without human intervention.',
  clear_quartz: 'The most common mineral on Earth, found in nearly every geological environment.',
  rose_quartz: 'Associated with love and emotional healing.',
  obsidian: 'Volcanic glass formed when lava cools rapidly.',
  moonstone: 'Displays adularescence - a billowy blue glow.',
  calcite: 'Exhibits double refraction - you can see two images through clear crystals.',
  fluorite: 'Fluorescent under UV light - the term "fluorescence" comes from fluorite.',
  malachite: 'Known for its striking green bands and patterns.',
  azurite: 'Often found with malachite, forming beautiful blue-green combinations.',
  lapis_lazuli: 'Prized for thousands of years, used in King Tut\'s funeral mask.',
  hematite: 'An iron ore that leaves a red streak when scratched.',
  pyrite: 'Known as "fool\'s gold" for its metallic luster.',
  gypsum: 'The most common sulfate mineral, used in plaster and drywall.',
  mica: 'Perfect cleavage allows it to be split into thin transparent sheets.',
  quartz_geode: 'Hollow rocks lined with crystals, formed in bubbles of volcanic rock.',
  celestite: 'Named for its celestial sky-blue color.',
  labradorite: 'Displays labradorescence - a stunning play of colors.',
};

export default function Gemdex() {
  const { state, dispatch } = useGame();
  const discoveredGems = state.player.discoveredGems || [];
  const newDiscoveredGems = state.player.newDiscoveredGems || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const allItems = useMemo(() => getItems(), []);
  const discoveredIds = useMemo(() => new Set(discoveredGems), [discoveredGems]);
  const newIds = useMemo(() => new Set(newDiscoveredGems), [newDiscoveredGems]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const discovered = discoveredIds.size;
    const percentage = total > 0 ? Math.round((discovered / total) * 100) : 0;
    return { total, discovered, percentage };
  }, [allItems, discoveredIds]);

  const filteredItems = useMemo(() => {
    let items = allItems.map(item => ({
      ...item,
      discovered: discoveredIds.has(item.id),
      isNew: newIds.has(item.id),
    }));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(query));
    }

    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter);
    }

    if (rarityFilter !== 'all') {
      items = items.filter(item => item.rarity === rarityFilter);
    }

    if (statusFilter !== 'all') {
      items = items.filter(item => 
        statusFilter === 'discovered' ? item.discovered : !item.discovered
      );
    }

    items.sort((a, b) => {
      if (a.discovered !== b.discovered) return b.discovered ? 1 : -1;
      if (a.isNew !== b.isNew) return b.isNew ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [allItems, searchQuery, categoryFilter, rarityFilter, statusFilter, discoveredIds, newIds]);

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  const openItemDetail = (item) => {
    if (item.discovered) {
      setSelectedItem(item);
      if (item.isNew && newDiscoveredGems.length > 0) {
        dispatch({ type: CLEAR_NEW_DISCOVERED });
      }
    }
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setRarityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || rarityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-6 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center w-full mb-4 pb-4 border-b-2 border-yellow-600">
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-yellow-400 m-0">📖 GEMDEX</h2>
        <div className="font-bold text-lg">
          <span className="text-yellow-400">{stats.discovered}</span>
          <span className="text-white">/{stats.total}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 w-full">
        <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="font-bold text-yellow-400 min-w-[4rem] text-right">{stats.percentage}%</span>
      </div>

      <div className="flex gap-2 mb-4 w-full">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-700 border border-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-yellow-400 font-bold self-center mr-2">Category:</span>
        {['all', 'Gem', 'Mineral', 'Metal'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 font-semibold text-sm cursor-pointer transition-all rounded-lg border-2 border-transparent ${
              categoryFilter === cat
                ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600 border-slate-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'Gem' ? 'Gems' : cat === 'Mineral' ? 'Minerals' : 'Metals'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-yellow-400 font-bold self-center mr-2">Rarity:</span>
        {['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map((rarity) => (
          <button
            key={rarity}
            onClick={() => setRarityFilter(rarity)}
            className={`px-3 py-1.5 font-semibold text-xs cursor-pointer transition-all rounded-full border ${
              rarityFilter === rarity
                ? `${RARITY_CONFIG[rarity]?.color || 'bg-yellow-400'} text-white border-transparent`
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600 border-slate-600'
            }`}
          >
            {rarity === 'all' ? 'All' : rarity}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-yellow-400 font-bold self-center mr-2">Status:</span>
        {['all', 'discovered', 'undiscovered'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-semibold text-sm cursor-pointer transition-all rounded-lg border-2 border-transparent ${
              statusFilter === status
                ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600 border-slate-600'
            }`}
          >
            {status === 'all' ? 'All' : status === 'discovered' ? '✓ Found' : '? Unknown'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 w-full pb-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`
              bg-slate-800 rounded-xl p-3 cursor-pointer transition-all shadow-md border-2
              ${item.discovered 
                ? 'border-slate-600 hover:border-yellow-400 hover:scale-105' 
                : 'opacity-60 border-slate-700 hover:opacity-80'
              }
            `}
            onClick={() => openItemDetail(item)}
          >
            <div className="text-3xl text-center mb-2">
              {item.discovered 
                ? item.category === 'Gem' ? <GemIcon /> 
                  : item.category === 'Mineral' ? <MineralIcon /> 
                  : <MetalIcon />
                : '❓'}
            </div>
            <h3 className="text-center font-semibold text-sm mb-2 text-white truncate">
              {item.discovered ? item.name : '???'}
            </h3>
            {item.discovered && (
              <div className="flex justify-center mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${RARITY_CONFIG[item.rarity]?.color}`}>
                  {item.rarity}
                </span>
              </div>
            )}
            {item.isNew && (
              <div className="flex justify-center">
                <span className="px-2 py-0.5 rounded bg-green-500 text-white text-xs font-bold animate-pulse">
                  NEW!
                </span>
              </div>
            )}
            {item.discovered && !item.isNew && (
              <div className="text-center text-sm font-bold text-yellow-400">
                ${item.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4"><FaSearch /></div>
          <p className="font-semibold text-lg">No items match your filters</p>
          <button 
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-yellow-400 text-slate-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {selectedItem && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={closeItemDetail}
        >
          <div 
            className="bg-slate-800 rounded-2xl p-6 md:p-8 max-w-lg w-full border-2 border-yellow-600 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-3 right-3 bg-transparent border-none text-3xl cursor-pointer text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center" 
              onClick={closeItemDetail}
            >
              ×
            </button>

            <div className="text-center mb-4">
              <div className="text-6xl mb-2">
                <GemIcon />
              </div>
              <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">
                {selectedItem.category}
              </span>
            </div>

            <h2 className="text-center font-bold text-2xl m-0 mb-2 text-white">
              {selectedItem.name}
            </h2>
            <div className="flex justify-center mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${RARITY_CONFIG[selectedItem.rarity]?.color}`}>
                {selectedItem.rarity}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-slate-700 rounded-xl">
                <span className="text-xs text-gray-400 uppercase tracking-wide mb-1">Value</span>
                <span className="text-2xl font-bold text-yellow-400">${selectedItem.value}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-slate-700 rounded-xl">
                <span className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hardness</span>
                <span className="text-2xl font-bold text-white">{selectedItem.hardness}</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold m-0 mb-2 text-sm text-yellow-400">Mohs Hardness Scale</h4>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 h-3 rounded-sm transition-colors ${
                      selectedItem.hardness >= n
                        ? 'bg-gradient-to-b from-cyan-300 to-slate-400'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold m-0 mb-2 text-sm text-yellow-400 flex items-center gap-1">
                <FaMapMarkedAlt /> Real World Locations
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.realWorldLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-700 rounded-full text-sm text-gray-300"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-xl border-l-4 border-yellow-500">
              <h4 className="font-semibold m-0 mb-2 text-sm text-yellow-400">💡 Did You Know?</h4>
              <p className="m-0 text-sm leading-relaxed text-gray-300">
                {ITEM_FACTS[selectedItem.id] || 'This fascinating specimen has unique properties waiting to be discovered.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}