import { useState, useMemo } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';
import { useInventory } from '../hooks/useInventory';
import { getItems, getItemById } from '../../../data/items';
import { FaSearch, FaArrowLeft, FaMapMarkedAlt } from 'react-icons/fa';
import { GemIcon, MineralIcon } from '../../../shared/components/ItemIcons';

// Rarity display configuration
const RARITY_CONFIG = {
  Common: { color: 'bg-gray-400', textColor: 'text-gray-700', borderColor: 'border-gray-400', label: 'Common' },
  Uncommon: { color: 'bg-green-500', textColor: 'text-green-700', borderColor: 'border-green-500', label: 'Uncommon' },
  Rare: { color: 'bg-blue-500', textColor: 'text-blue-700', borderColor: 'border-blue-500', label: 'Rare' },
  Epic: { color: 'bg-purple-500', textColor: 'text-purple-700', borderColor: 'border-purple-500', label: 'Epic' },
  Legendary: { color: 'bg-amber-500', textColor: 'text-amber-700', borderColor: 'border-amber-500', label: 'Legendary' },
};

// Item facts for detail modal
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
  parba_tourmaline: 'Known for vivid blue-green colors from copper content.',
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
  const { gemdex } = useInventory();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);

  // Get all 40 items
  const allItems = useMemo(() => getItems(), []);
  
  // Track discovered IDs
  const discoveredIds = useMemo(() => {
    return new Set(gemdex.map(g => g.id));
  }, [gemdex]);

  // Stats: X/40 Discovered
  const stats = useMemo(() => {
    const total = allItems.length;
    const discovered = discoveredIds.size;
    const percentage = total > 0 ? Math.round((discovered / total) * 100) : 0;
    return { total, discovered, percentage };
  }, [allItems, discoveredIds]);

  // Recently discovered items (for "NEW" badge)
  // Items discovered in the last 5 minutes are considered "NEW"
  const recentlyDiscoveredIds = useMemo(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return new Set(
      gemdex
        .filter(g => g.discoveredAt && g.discoveredAt > fiveMinutesAgo)
        .map(g => g.id)
    );
  }, [gemdex]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems.map(item => ({
      ...item,
      discovered: discoveredIds.has(item.id),
      isNew: recentlyDiscoveredIds.has(item.id),
    }));

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.discovered && item.name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      items = items.filter(item => 
        categoryFilter === 'gems' ? item.category === 'Gem' : item.category === 'Mineral'
      );
    }

    // Rarity filter
    if (rarityFilter !== 'all') {
      items = items.filter(item => item.rarity === rarityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      items = items.filter(item => 
        statusFilter === 'discovered' ? item.discovered : !item.discovered
      );
    }

    // Sort: discovered first, then by name
    items.sort((a, b) => {
      if (a.discovered !== b.discovered) return b.discovered ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [allItems, searchQuery, categoryFilter, rarityFilter, statusFilter, discoveredIds, recentlyDiscoveredIds]);

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  const openItemDetail = (item) => {
    if (item.discovered) {
      setSelectedItem(item);
    }
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
  };

  // Get icon based on category
  const getItemIcon = (item) => {
    if (!item.discovered) return '❓';
    return item.category === 'Gem' ? <GemIcon /> : <MineralIcon />;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setRarityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || rarityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="font-serif min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 pb-4 border-b-2 border-amber-700">
        <button 
          onClick={handleBack} 
          className="bg-transparent border border-amber-700 text-amber-900 px-4 py-2 font-serif cursor-pointer transition-all hover:bg-amber-700 hover:text-amber-50"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="font-serif text-2xl m-0 text-amber-900" style={{ textShadow: '1px 1px 1px rgba(184, 115, 51, 0.3)' }}>
          📖 Gemdex
        </h1>
        <div className="font-bold text-lg">
          <span className="text-amber-700">{stats.discovered}</span>
          <span className="text-amber-900">/{stats.total} Discovered</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-4 bg-amber-200 rounded-full overflow-hidden border border-amber-700 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="font-bold text-amber-900 min-w-[4rem] text-right">{stats.percentage}%</span>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
           <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-amber-50 border border-amber-700 text-amber-900 font-serif rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-amber-400"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-amber-200 border border-amber-700 text-amber-900 font-serif rounded-lg hover:bg-amber-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-amber-700 font-bold self-center mr-2">Category:</span>
        {['all', 'gems', 'minerals'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 font-serif text-sm cursor-pointer transition-all rounded-lg border ${
              categoryFilter === cat
                ? 'bg-amber-700 text-amber-50 border-amber-700'
                : 'bg-transparent border-amber-700 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'gems' ? <><GemIcon /> Gems</> : <><MineralIcon /> Minerals</>}
          </button>
        ))}
      </div>

      {/* Rarity Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-amber-700 font-bold self-center mr-2">Rarity:</span>
        {['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map((rarity) => (
          <button
            key={rarity}
            onClick={() => setRarityFilter(rarity)}
            className={`px-3 py-1.5 font-serif text-xs cursor-pointer transition-all rounded-full border ${
              rarityFilter === rarity
                ? `${RARITY_CONFIG[rarity]?.color || 'bg-amber-700'} text-white border-transparent`
                : 'bg-transparent border-amber-700 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {rarity === 'all' ? 'All' : rarity}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-amber-700 font-bold self-center mr-2">Status:</span>
        {['all', 'discovered', 'undiscovered'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-serif text-sm cursor-pointer transition-all rounded-lg border ${
              statusFilter === status
                ? 'bg-amber-700 text-amber-50 border-amber-700'
                : 'bg-transparent border-amber-700 text-amber-900 hover:bg-amber-100'
            }`}
          >
            {status === 'all' ? 'All' : status === 'discovered' ? '✓ Discovered' : '? Undiscovered'}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`
              bg-amber-50 rounded-xl p-4 cursor-pointer transition-all shadow-md border-2
              ${item.discovered 
                ? 'border-amber-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-500' 
                : 'opacity-60 border-dashed border-amber-300 hover:opacity-80'
              }
            `}
            onClick={() => openItemDetail(item)}
          >
            {/* Icon */}
            <div className="text-4xl text-center mb-2">
              {getItemIcon(item)}
            </div>

            {/* Name */}
            <h3 className="text-center font-serif text-sm mb-2 truncate">
              {item.discovered ? item.name : '???'}
            </h3>

            {/* Rarity Badge */}
            {item.discovered && (
              <div className="flex justify-center mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${RARITY_CONFIG[item.rarity]?.color}`}>
                  {item.rarity}
                </span>
              </div>
            )}

            {/* NEW Badge */}
            {item.isNew && (
              <div className="flex justify-center">
                <span className="px-2 py-0.5 rounded bg-green-500 text-white text-xs font-bold animate-pulse">
                  NEW!
                </span>
              </div>
            )}

            {/* Value */}
            {item.discovered && (
              <div className="text-center text-sm font-bold text-amber-700">
                ${item.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-amber-700">
          <div className="text-6xl mb-4"><FaSearch /></div>
          <p className="font-serif text-lg">No items match your filters</p>
          <button 
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg font-serif hover:bg-amber-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-amber-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={closeItemDetail}
        >
          <div 
            className="bg-amber-50 rounded-2xl p-6 md:p-8 max-w-lg w-full border-2 border-amber-700 shadow-2xl relative max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-3 right-3 bg-transparent border-none text-3xl cursor-pointer text-amber-900 hover:text-amber-700 w-8 h-8 flex items-center justify-center" 
              onClick={closeItemDetail}
            >
              ×
            </button>

            {/* Icon and Category */}
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">
                {selectedItem.category === 'Gem' ? <GemIcon /> : <MineralIcon />}
              </div>
              <span className="text-amber-600 font-serif text-sm uppercase tracking-wide">
                {selectedItem.category}
              </span>
            </div>

            {/* Name and Rarity */}
            <h2 className="text-center font-serif text-2xl m-0 mb-2 text-amber-900">
              {selectedItem.name}
            </h2>
            <div className="flex justify-center mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${RARITY_CONFIG[selectedItem.rarity]?.color}`}>
                {selectedItem.rarity}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-amber-100 rounded-xl">
                <span className="text-xs text-amber-600 uppercase tracking-wide mb-1">Value</span>
                <span className="text-2xl font-bold text-amber-900">${selectedItem.value}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-100 rounded-xl">
                <span className="text-xs text-amber-600 uppercase tracking-wide mb-1">Hardness</span>
                <span className="text-2xl font-bold text-amber-900">{selectedItem.hardness}</span>
              </div>
            </div>

            {/* Mohs Scale */}
            <div className="mb-6">
              <h4 className="font-serif m-0 mb-2 text-sm text-amber-700">Mohs Hardness Scale</h4>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 h-3 rounded-sm transition-colors ${
                      selectedItem.hardness >= n
                        ? 'bg-gradient-to-b from-cyan-300 to-slate-400'
                        : 'bg-amber-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-amber-600 mt-1">
                <span>1 (Talc)</span>
                <span>10 (Diamond)</span>
              </div>
            </div>

            {/* Real World Locations */}
            <div className="mb-6">
              <h4 className="font-serif m-0 mb-2 text-sm text-amber-700 flex items-center gap-1"><FaMapMarkedAlt /> Real World Locations</h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.realWorldLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-100 rounded-full text-sm text-amber-800"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            {/* Fun Fact */}
            <div className="bg-amber-100 p-4 rounded-xl border-l-4 border-amber-600">
              <h4 className="font-serif m-0 mb-2 text-sm text-amber-700">💡 Did You Know?</h4>
              <p className="m-0 text-sm leading-relaxed text-amber-800">
                {ITEM_FACTS[selectedItem.id] || 'This fascinating specimen has unique properties waiting to be discovered.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
