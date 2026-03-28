import { useState, useMemo } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';
import { useInventory } from '../hooks/useInventory';
import gemsData from '../../../data/gems.json';
import { LOCATION_TIERS } from '../../../data/locations';
import { getGemSources } from '../../../data/lootTables';

const MINERAL_FAMILIES = {
  quartz: { name: 'Quartz', color: '#e8e8e8' },
  garnet: { name: 'Garnet', color: '#8b0000' },
  beryl: { name: 'Beryl', color: '#50c878' },
  corundum: { name: 'Corundum', color: '#e31c3d' },
  topaz: { name: 'Topaz', color: '#ffc87c' },
  tourmaline: { name: 'Tourmaline', color: '#00ced1' },
  feldspar: { name: 'Feldspar', color: '#faf0e6' },
  diamond: { name: 'Diamond', color: '#b9f2ff' },
  zoisite: { name: 'Zoisite', color: '#6a5acd' },
  chrysoberyl: { name: 'Chrysoberyl', color: '#9acd32' },
  borate: { name: 'Borate', color: '#8b4513' },
};

const GEM_FACTS = {
  quartz_clear: 'The most common mineral on Earth, found in nearly every geological environment.',
  amethyst: 'February\'s birthstone. Its purple color comes from iron impurities and irradiation.',
  garnet: 'Named after "pomegranate" for its deep red color. Used as an abrasive.',
  citrine: 'November\'s birthstone. Most citrine on the market is heat-treated amethyst.',
  rose_quartz: 'Associated with love and emotional healing. Color fades with exposure to light.',
  smoky_quartz: 'Color caused by natural radiation. Scottish legend says it\'s crystallized mist.',
  moonstone: 'June\'s birthstone. Displays adularescence - a billowy blue glow.',
  tourmaline: 'Comes in more colors than any other gemstone. Brazil is the primary source.',
  aquamarine: 'March\'s birthstone. Name means "seawater" in Latin.',
  morganite: 'Named after J.P. Morgan. Part of the beryl family with rose-pink color.',
  emerald: 'May\'s birthstone. Most emeralds have inclusions called "jardin" (garden).',
  sapphire: 'September\'s birthstone. Comes in every color except red (that\'s ruby).',
  yogo_sapphire: 'Found only in Yogo Gulch, Montana. Known for uniform cornflower blue.',
  ruby: 'July\'s birthstone. The finest color is called "pigeon blood" red.',
  topaz: 'November\'s birthstone. Often irradiated to produce blue color.',
  imperial_topaz: 'The most valuable topaz. Named after Brazilian imperial family.',
  diamond: 'April\'s birthstone. The hardest natural material on Earth.',
  tanzanite: 'Discovered in 1967. Found only in Tanzania, one source worldwide.',
  alexandrite: 'Color changes from green (daylight) to red (incandescent light).',
  painite: 'Once the world\'s rarest gemstone. Recently found in larger quantities.',
};

export default function Gemdex() {
  const { state, dispatch } = useGame();
  const { gemdex } = useInventory();
  const [selectedGem, setSelectedGem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const discoveredGemIds = useMemo(() => {
    return new Set(gemdex.map(g => g.id));
  }, [gemdex]);

  const stats = useMemo(() => {
    const total = gemsData.gems.length;
    const discovered = discoveredGemIds.size;
    const percentage = total > 0 ? Math.round((discovered / total) * 100) : 0;
    return { total, discovered, percentage };
  }, [discoveredGemIds]);

  const filteredGems = useMemo(() => {
    let gems = gemsData.gems.map(gem => ({
      ...gem,
      discovered: discoveredGemIds.has(gem.id),
      family: MINERAL_FAMILIES[gem.type] || MINERAL_FAMILIES.quartz,
    }));

    if (filter === 'discovered') {
      gems = gems.filter(g => g.discovered);
    } else if (filter === 'undiscovered') {
      gems = gems.filter(g => !g.discovered);
    }

    gems.sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      if (sortBy === 'hardness') return b.hardness - a.hardness;
      return a.name.localeCompare(b.name);
    });

    return gems;
  }, [filter, sortBy, discoveredGemIds]);

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  const openGemDetail = (gem) => {
    if (gem.discovered) {
      setSelectedGem(gem);
    }
  };

  const closeGemDetail = () => {
    setSelectedGem(null);
  };

  return (
    <div className="font-serif min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4 pb-4 border-b-2 border-amber-700">
        <button onClick={handleBack} className="bg-transparent border border-amber-700 text-amber-900 px-4 py-2 font-serif cursor-pointer transition-all hover:bg-amber-700 hover:text-amber-50">← Back</button>
        <h1 className="font-serif text-2xl m-0 text-amber-900" style={{ textShadow: '1px 1px 1px rgba(184, 115, 51, 0.3)' }}>Gemdex</h1>
        <div className="font-bold text-lg">
          <span className="text-amber-700">{stats.discovered}</span>/<span>{stats.total}</span>
        </div>
      </header>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex">
          {['all', 'discovered', 'undiscovered'].map(f => (
            <button
              key={f}
              className={`
                bg-transparent border border-amber-700 text-amber-900 px-4 py-2 font-serif text-sm cursor-pointer transition-all
                ${filter === f ? 'bg-amber-700 text-amber-50' : 'hover:bg-amber-700/20'}
                ${f === 'all' ? 'rounded-l-lg' : ''}
                ${f === 'undiscovered' ? 'rounded-r-lg' : ''}
                ${f !== 'all' ? '-ml-px' : ''}
              `}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-amber-50 border border-amber-700 text-amber-900 px-4 py-2 font-serif text-sm cursor-pointer rounded">
          <option value="name">Name</option>
          <option value="value">Value</option>
          <option value="hardness">Hardness</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-3 bg-amber-200 rounded overflow-hidden border border-amber-700">
          <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300" style={{ width: `${stats.percentage}%` }} />
        </div>
        <span className="font-bold min-w-[3rem] text-right">{stats.percentage}%</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8">
        {filteredGems.map(gem => (
          <div
            key={gem.id}
            className={`
              bg-amber-50 rounded-lg p-4 cursor-pointer transition-all shadow-sm border border-amber-300/50
              ${gem.discovered ? 'hover:-translate-y-1 hover:shadow-md' : 'opacity-70 border-dashed'}
            `}
            onClick={() => openGemDetail(gem)}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3 border-2 border-amber-700 text-amber-900" style={{ backgroundColor: gem.discovered ? gem.family.color : '#ccc' }}>
              {gem.discovered ? gem.name[0] : '?'}
            </div>
            <div className="text-center">
              <h3 className="m-0 mb-1 text-sm font-serif">{gem.discovered ? gem.name : '???'}</h3>
              {gem.discovered && <span className="block text-xs text-amber-700/70 mb-1">{gem.family.name}</span>}
              {gem.discovered && <span className="block text-sm font-bold text-amber-700">${gem.value}</span>}
              <div className="text-xs text-slate-500 mt-1">
                {(() => {
                  const sources = getGemSources(gem.id);
                  if (sources.length > 0) {
                    return `Found in ${sources[0].location.name}`;
                  }
                  return 'Undiscovered';
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGem && (
        <div className="fixed inset-0 bg-amber-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeGemDetail}>
          <div className="bg-amber-50 rounded-xl p-8 max-w-md w-full border-2 border-amber-700 shadow-xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button className="absolute top-3 right-3 bg-transparent border-none text-3xl cursor-pointer text-amber-900 hover:text-amber-700 w-8 h-8 flex items-center justify-center" onClick={closeGemDetail}>×</button>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4 border-3 border-amber-700 text-amber-900" style={{ backgroundColor: selectedGem.family.color }}>
              {selectedGem.name[0]}
            </div>
            <h2 className="text-center font-serif text-2xl m-0 mb-1">{selectedGem.name}</h2>
            <span className="block text-center text-amber-700/70 mb-6">{selectedGem.family.name}</span>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center p-3 bg-amber-700/10 rounded-lg"><span className="text-xs text-amber-700/70 uppercase tracking-wide">Value</span><span className="text-xl font-bold text-amber-900">${selectedGem.value}</span></div>
              <div className="flex flex-col items-center p-3 bg-amber-700/10 rounded-lg"><span className="text-xs text-amber-700/70 uppercase tracking-wide">Hardness</span><span className="text-xl font-bold text-amber-900">{selectedGem.hardness}</span></div>
            </div>

            <div className="mb-6">
              <h4 className="font-serif m-0 mb-2 text-base">Mohs Hardness</h4>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} className={`flex-1 h-4 bg-amber-200 rounded-sm transition-colors ${selectedGem.hardness >= n ? 'bg-gradient-to-b from-cyan-200 to-gray-400' : ''}`} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-amber-700/70"><span>Talc</span><span>Diamond</span></div>
            </div>

            <div className="mb-6">
              <h4 className="font-serif m-0 mb-2 text-base">Found At</h4>
              {selectedGem.locations.map(locKey => {
                const loc = LOCATION_TIERS[locKey];
                const isUnlocked = state.player.shiftPoints >= loc.unlockLevel;
                return (
                  <div key={locKey} className={`flex items-center gap-2 p-2 bg-amber-700/10 rounded mb-1 ${!isUnlocked ? 'opacity-60' : ''}`}>
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: loc.color }} />
                    <span className="flex-1 text-sm">{loc.name}</span>
                    {!isUnlocked && <span className="text-xs">🔒</span>}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-amber-900/30">
              <h4 className="text-sm font-bold text-amber-200 mb-2">📍 Found In:</h4>
              {(() => {
                const sources = getGemSources(selectedGem.id);
                if (sources.length === 0) {
                  return <p className="text-sm text-slate-500">Not yet discovered in any location</p>;
                }
                return (
                  <ul className="space-y-1">
                    {sources.map((source, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span style={{ color: source.location.color }}>●</span>
                        <span>
                          <span className="font-semibold">{source.location.name}</span>
                          <span className="text-slate-500"> - {source.area.name}</span>
                          <span 
                            className="ml-2 text-xs font-semibold"
                            style={{ color: source.rarity === 'COMMON' ? '#A0A0A0' : 
                                         source.rarity === 'UNCOMMON' ? '#4CAF50' : 
                                         source.rarity === 'RARE' ? '#2196F3' : 
                                         source.rarity === 'EPIC' ? '#9C27B0' : '#FF9800' }}
                          >
                            {source.rarity}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            <div className="bg-amber-700/10 p-4 rounded-lg border-l-3 border-amber-700">
              <h4 className="font-serif m-0 mb-2 text-base">Did You Know?</h4>
              <p className="m-0 text-sm leading-relaxed text-amber-800/80">{GEM_FACTS[selectedGem.id] || 'No facts available.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
