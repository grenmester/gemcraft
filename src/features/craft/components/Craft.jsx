import { useState, useMemo } from 'react';
import { useGame, GAME_PHASES, SET_PHASE, CRAFT_ITEM } from '../../../context/GameContext';
import { FaGem, FaArrowLeft, FaCrown, FaRing, FaStar, FaMagic } from 'react-icons/fa';
import { RECIPES, JEWELRY_TYPES, SETTINGS, FINDINGS, getRecipesByType, calculateCraftValue } from '../../../data/recipes';

const JEWELRY_ICONS = {
  ring: FaRing,
  pendant: FaGem,
  earrings: FaStar,
  bracelet: FaMagic,
  necklace: FaGem,
  crown: FaCrown
};

export default function Craft() {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState('ring');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [craftingMessage, setCraftingMessage] = useState(null);
  
  const playerXP = state.player?.craftingXP || 0;
  const inventory = state.player?.inventory || {};
  
  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  const jewelryTypes = Object.keys(JEWELRY_TYPES);
  
  const filteredRecipes = useMemo(() => {
    return getRecipesByType(activeTab);
  }, [activeTab]);

  const getInventoryGems = () => {
    return (inventory.gems || []).concat(inventory.minerals || []);
  };
  
  const getInventoryMetals = () => {
    return inventory.metals || [];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          className="flex items-center gap-2 text-gray-400 hover:text-white"
          onClick={handleBack}
        >
          <FaArrowLeft /> Menu
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Craft</h2>
        <div className="text-amber-400 text-sm">XP: {playerXP}</div>
      </div>

      {/* Crafting Message */}
      {craftingMessage && (
        <div className={`mb-4 p-3 rounded-lg text-center font-bold ${craftingMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {craftingMessage.text}
        </div>
      )}

      {/* Jewelry Type Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {jewelryTypes.map(type => {
          const Icon = JEWELRY_ICONS[type] || FaGem;
          const isActive = activeTab === type;
          const typeInfo = JEWELRY_TYPES[type];
          
          return (
            <button
              key={type}
              onClick={() => { setActiveTab(type); setSelectedRecipe(null); }}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all min-w-[80px]
                ${isActive 
                  ? 'bg-amber-500 text-slate-900' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }
              `}
            >
              <Icon className="text-lg" />
              <span className="text-xs capitalize">{type}</span>
            </button>
          );
        })}
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-auto">
        {selectedRecipe ? (
          <RecipeDetail 
            recipe={selectedRecipe}
            gems={getInventoryGems()}
            metals={getInventoryMetals()}
            onBack={() => setSelectedRecipe(null)}
            dispatch={dispatch}
            onCrafted={(msg) => setCraftingMessage(msg)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredRecipes.map(recipe => {
              const isUnlocked = playerXP >= recipe.xpRequired;
              const typeInfo = JEWELRY_TYPES[recipe.type];
              
              return (
                <button
                  key={recipe.id}
                  onClick={() => isUnlocked && setSelectedRecipe(recipe)}
                  disabled={!isUnlocked}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isUnlocked 
                      ? 'bg-slate-800 border-slate-600 hover:border-amber-500 hover:scale-105' 
                      : 'bg-slate-900 border-slate-700 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="text-white font-semibold mb-1">{recipe.name}</div>
                  <div className="text-amber-400 text-sm mb-2">{recipe.baseValue} coins</div>
                  <div className="text-gray-400 text-xs">
                    {isUnlocked ? `${typeInfo.complexity}` : `Need ${recipe.xpRequired} XP`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeDetail({ recipe, gems, metals, onBack, dispatch, onCrafted }) {
  const [selectedGems, setSelectedGems] = useState([]);
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedSetting, setSelectedSetting] = useState(recipe.settings[0]);
  
  const gemRequirements = recipe.requirements.gems;
  const metalRequirement = recipe.requirements.metal;
  
  const eligibleGems = gems.filter(g => {
    const req = gemRequirements[selectedGems.length];
    if (!req) return false;
    return g.quality >= req.qualityMin;
  });
  
  const eligibleMetals = metals.filter(m => {
    return m.id === metalRequirement.id && m.quality >= metalRequirement.qualityMin;
  });
  
  const canCraft = selectedGems.length >= gemRequirements.length && selectedMetal;
  
  const estimatedValue = canCraft ? calculateCraftValue(recipe, selectedGems, selectedMetal, selectedSetting) : 0;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2">
        <FaArrowLeft /> Back to recipes
      </button>
      
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-xl text-amber-400 font-bold mb-2">{recipe.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{recipe.design} {recipe.type}</p>
        
        {/* Requirements */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="text-gray-400 text-sm mb-2">Gems Required ({selectedGems.length}/{gemRequirements.length})</div>
            <div className="flex gap-2 flex-wrap">
              {gemRequirements.map((req, idx) => {
                const hasGem = selectedGems[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (hasGem) {
                        setSelectedGems(prev => prev.filter((_, i) => i !== idx));
                      } else if (eligibleGems.length > 0) {
                        setSelectedGems(prev => [...prev, eligibleGems[0]]);
                      }
                    }}
                    className={`
                      px-3 py-1 rounded text-sm
                      ${hasGem 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-slate-700 text-gray-400'
                      }
                    `}
                  >
                    {hasGem ? hasGem.gemId || hasGem.id : `Gem ${idx + 1} (${req.qualityMin}%+)`}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-2">Metal Required ({selectedMetal ? 'selected' : 'none'})</div>
            <div className="flex gap-2">
              {eligibleMetals.length > 0 ? (
                <button
                  onClick={() => setSelectedMetal(eligibleMetals[0])}
                  className={`
                    px-3 py-1 rounded text-sm
                    ${selectedMetal?.id === metalRequirement.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-gray-400'
                    }
                  `}
                >
                  {metalRequirement.id} ({metalRequirement.qualityMin}%+)
                </button>
              ) : (
                <span className="text-gray-500 text-sm">No eligible metals</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-2">Setting</div>
            <div className="flex gap-2">
              {recipe.settings.map(setting => (
                <button
                  key={setting}
                  onClick={() => setSelectedSetting(setting)}
                  className={`
                    px-3 py-1 rounded text-sm
                    ${selectedSetting === setting
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 text-gray-400'
                    }
                  `}
                >
                  {SETTINGS[setting]?.name || setting}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Value Preview */}
        <div className="bg-slate-900 rounded-lg p-4 mb-4">
          <div className="text-gray-400 text-sm mb-1">Estimated Value</div>
          <div className="text-2xl text-yellow-400 font-bold">
            {canCraft ? estimatedValue.toLocaleString() : '---'} coins
          </div>
        </div>
        
        {/* Craft Button */}
        <button
          disabled={!canCraft}
          onClick={() => {
            dispatch({
              type: CRAFT_ITEM,
              payload: {
                recipeId: recipe.id,
                selectedGems,
                selectedMetal,
                selectedSetting
              }
            });
            onCrafted({ type: 'success', text: `Crafted ${recipe.name}! +${10 + Math.max(0, Math.floor((selectedGems.reduce((s, g) => s + (g.quality || 0), 0) / selectedGems.length) - 80))} XP` });
            onBack();
          }}
          className={`
            w-full py-3 rounded-lg font-bold text-lg transition-all
            ${canCraft
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
              : 'bg-slate-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {canCraft ? 'Craft Item' : 'Missing Materials'}
        </button>
      </div>
    </div>
  );
}