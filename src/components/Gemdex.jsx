import { useState, useMemo } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import gemsData from '../data/gems.json';
import { LOCATION_TIERS } from '../data/locations';
import './Gemdex.css';

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
  const [selectedGem, setSelectedGem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const discoveredGemIds = useMemo(() => {
    return new Set(state.player.gemdex?.map(g => g.id) || []);
  }, [state.player.gemdex]);

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
    <div className="gemdex screen">
      <header className="gemdex-header">
        <button onClick={handleBack}>← Back</button>
        <h1 className="gemdex-title">Gemdex</h1>
        <div className="gemdex-stats">
          <span>{stats.discovered}</span>/<span>{stats.total}</span>
        </div>
      </header>

      <div className="gemdex-toolbar">
        <div className="filter-tabs">
          {['all', 'discovered', 'undiscovered'].map(f => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Name</option>
          <option value="value">Value</option>
          <option value="hardness">Hardness</option>
        </select>
      </div>

      <div className="gemdex-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.percentage}%` }} />
        </div>
        <span>{stats.percentage}%</span>
      </div>

      <div className="gemdex-grid">
        {filteredGems.map(gem => (
          <div
            key={gem.id}
            className={`gem-card ${gem.discovered ? 'discovered' : 'undiscovered'}`}
            onClick={() => openGemDetail(gem)}
          >
            <div className="gem-icon" style={{ backgroundColor: gem.family.color }}>
              {gem.discovered ? gem.name[0] : '?'}
            </div>
            <div className="gem-info">
              <h3>{gem.discovered ? gem.name : '???'}</h3>
              {gem.discovered && <span className="gem-family">{gem.family.name}</span>}
              {gem.discovered && <span className="gem-value">${gem.value}</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedGem && (
        <div className="gem-detail-overlay" onClick={closeGemDetail}>
          <div className="gem-detail-card" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={closeGemDetail}>×</button>
            <div className="detail-gem-icon" style={{ backgroundColor: selectedGem.family.color }}>
              {selectedGem.name[0]}
            </div>
            <h2>{selectedGem.name}</h2>
            <span className="detail-family">{selectedGem.family.name}</span>
            
            <div className="detail-stats">
              <div><span>Value</span><span>${selectedGem.value}</span></div>
              <div><span>Hardness</span><span>{selectedGem.hardness}</span></div>
            </div>

            <div className="detail-mohs-scale">
              <h4>Mohs Hardness</h4>
              <div className="mohs-bar">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} className={selectedGem.hardness >= n ? 'active' : ''} />
                ))}
              </div>
              <div className="mohs-labels"><span>Talc</span><span>Diamond</span></div>
            </div>

            <div className="detail-locations">
              <h4>Found At</h4>
              {selectedGem.locations.map(locKey => {
                const loc = LOCATION_TIERS[locKey];
                const isUnlocked = state.player.shiftPoints >= loc.unlockLevel;
                return (
                  <div key={locKey} className={`location-tag ${isUnlocked ? '' : 'locked'}`}>
                    <span style={{ backgroundColor: loc.color }} />
                    <span>{loc.name}</span>
                    {!isUnlocked && <span className="lock-icon">🔒</span>}
                  </div>
                );
              })}
            </div>

            <div className="detail-fact">
              <h4>Did You Know?</h4>
              <p>{GEM_FACTS[selectedGem.id] || 'No facts available.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
