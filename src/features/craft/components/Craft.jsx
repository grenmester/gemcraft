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
  const [showGemPicker, setShowGemPicker] = useState(null); // which gem slot to fill
  
  const gemRequirements = recipe.requirements.gems;
  const metalRequirement = recipe.requirements.metal;
  
  // Get all eligible gems for each requirement slot
  const getEligibleGemsForSlot = (slotIdx) => {
    const req = gemRequirements[slotIdx];
    if (!req) return [];
    return gems.filter(g => g.quality >= req.qualityMin);
  };
  
  const eligibleMetals = metals.filter(m => {
    return m.id === metalRequirement.id && m.quality >= metalRequirement.qualityMin;
  });
  
  const canCraft = selectedGems.length >= gemRequirements.length && selectedMetal;
  
  const estimatedValue = canCraft ? calculateCraftValue(recipe, selectedGems, selectedMetal, selectedSetting) : 0;

  const handleSelectGem = (gem, slotIdx) => {
    const newSelected = [...selectedGems];
    newSelected[slotIdx] = gem;
    setSelectedGems(newSelected);
    setShowGemPicker(null);
  };

  const handleRemoveGem = (slotIdx) => {
    const newSelected = selectedGems.filter((_, idx) => idx !== slotIdx);
    setSelectedGems(newSelected);
  };

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
          {/* Gem Selection */}
          <div>
            <div className="text-gray-400 text-sm mb-2">Gems Required ({selectedGems.length}/{gemRequirements.length})</div>
            <div className="flex gap-2 flex-wrap">
              {gemRequirements.map((req, idx) => {
                const hasGem = selectedGems[idx];
                return (
                  <div key={idx} className="relative">
                    {hasGem ? (
                      <button
                        onClick={() => handleRemoveGem(idx)}
                        className="px-3 py-1 rounded text-sm bg-cyan-600 text-white hover:bg-red-600 transition-colors"
                      >
                        {hasGem.gemId || hasGem.id} ({Math.round(hasGem.quality || 50)}%)
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowGemPicker(idx)}
                        className="px-3 py-1 rounded text-sm bg-slate-700 text-gray-400 hover:bg-slate-600"
                      >
                        + Gem {idx + 1} ({req.qualityMin}%+)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Gem Picker Modal */}
            {showGemPicker !== null && (
              <div className="mt-2 p-3 bg-slate-900 rounded-lg max-h-48 overflow-auto">
                <div className="text-gray-400 text-xs mb-2">Select a gem for slot {showGemPicker + 1}:</div>
                {getEligibleGemsForSlot(showGemPicker).length === 0 ? (
                  <div className="text-gray-500 text-sm">No eligible gems available</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getEligibleGemsForSlot(showGemPicker).map((gem, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectGem(gem, showGemPicker)}
                        className="px-2 py-1 text-xs bg-slate-700 text-white rounded hover:bg-cyan-600"
                      >
                        {gem.gemId || gem.id} (Q:{Math.round(gem.quality || 50)}%) x{gem.quantity}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Metal Selection */}
          <div>
            <div className="text-gray-400 text-sm mb-2">Metal Required</div>
            <div className="flex gap-2 flex-wrap">
              {eligibleMetals.length > 0 ? (
                eligibleMetals.map((metal, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMetal(metal)}
                    className={`
                      px-3 py-1 rounded text-sm
                      ${selectedMetal?.id === metal.id && selectedMetal?.quality === metal.quality
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }
                    `}
                  >
                    {metal.id} (Q:{Math.round(metal.quality || 50)}%) x{metal.quantity}
                  </button>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No eligible metals - process ores first</span>
              )}
            </div>
          </div>
          
          {/* Setting Selection */}
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