import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame, START_ACTIVE_PROCESS, COMPLETE_ACTIVE_PROCESS } from '../../../context/GameContext';
import { useProcess } from '../hooks/useProcess';
import { getItemById } from '../../../data/items';
import { FaTools, FaCut, FaCog, FaArrowLeft, FaStar, FaGem, FaSpinner } from 'react-icons/fa';
import { GemIcon, MineralIcon } from '../../../shared/components/ItemIcons';

const PROCESS_TYPES = [
  { id: 'cleaning', label: 'Cleaning', description: 'Tumble and clean', Icon: FaTools },
  { id: 'cutting', label: 'Cutting', description: 'Shape and cut facets', Icon: FaCut },
  { id: 'faceting', label: 'Faceting', description: 'Polish for brilliance', Icon: FaCog },
];

const QUALITY_LEVELS = [
  { id: 'low', label: 'Low', description: '40-60% quality', cooldown: 3, color: 'gray', icon: FaTools },
  { id: 'medium', label: 'Medium', description: '60-80% quality', cooldown: 8, color: 'blue', icon: FaCut },
  { id: 'high', label: 'High', description: '80-100% quality', cooldown: 15, color: 'purple', icon: FaStar },
];

const RARITY_COLORS = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
};

const QUALITY_COLORS = {
  low: 'bg-gray-600 hover:bg-gray-500',
  medium: 'bg-blue-600 hover:bg-blue-500',
  high: 'bg-purple-600 hover:bg-purple-500',
};

const COOLDOWN_COLORS = {
  low: 'bg-gray-800 text-gray-500 cursor-not-allowed',
  medium: 'bg-blue-900/50 text-blue-500 cursor-not-allowed',
  high: 'bg-purple-900/50 text-purple-500 cursor-not-allowed',
};

const CATEGORY_ICONS = {
  Gem: GemIcon,
  Mineral: MineralIcon,
};

export default function ActiveProcessing() {
  const { state, dispatch } = useGame();
  const { availableItems } = useProcess();
  const [step, setStep] = useState('select'); // 'select' | 'type' | 'quality' | 'processing' | 'result'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  const [cooldowns, setCooldowns] = useState({});

  // Sync cooldowns from state
  useEffect(() => {
    const savedCooldowns = state.processState?.processCooldowns || {};
    setCooldowns(savedCooldowns);
  }, [state.processState?.processCooldowns]);

  // Enrich available items with data
  const itemsWithData = useMemo(() => {
    return availableItems.map(invItem => {
      const itemData = getItemById(invItem.id);
      const Icon = CATEGORY_ICONS[itemData?.category] || GemIcon;
      return {
        ...invItem,
        data: itemData,
        displayName: itemData?.name || invItem.id,
        category: itemData?.category || 'Unknown',
        rarity: itemData?.rarity || 'Common',
        value: itemData?.value || 0,
        hardness: itemData?.hardness || 5,
        canClean: itemData?.processing?.canClean ?? false,
        canCut: itemData?.processing?.canCut ?? false,
        canFacet: itemData?.processing?.canFacet ?? false,
        Icon,
      };
    });
  }, [availableItems]);

  const getCooldownRemaining = useCallback((itemId, qualityLevel) => {
    const itemCooldowns = cooldowns[itemId] || {};
    const endTime = itemCooldowns[qualityLevel] || 0;
    const remaining = endTime - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, [cooldowns]);

  const isOnCooldown = useCallback((itemId, qualityLevel) => {
    return getCooldownRemaining(itemId, qualityLevel) > 0;
  }, [getCooldownRemaining]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setStep('type');
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep('quality');
  };

  const handleSelectQuality = (qualityLevel) => {
    setSelectedQuality(qualityLevel);
    startProcessing(qualityLevel);
  };

  const startProcessing = (qualityLevel) => {
    if (!selectedItem || !selectedType) return;

    // Start the active process in state
    dispatch({
      type: START_ACTIVE_PROCESS,
      payload: {
        itemId: selectedItem.id,
        processType: selectedType.id,
        qualityLevel
      }
    });

    setStep('processing');
  };

  // Handle when activeProcess completes
  useEffect(() => {
    if (step === 'processing' && state.processState?.activeProcess) {
      const active = state.processState.activeProcess;
      const itemData = getItemById(active.itemId);
      const quality = active.quality;
      const isMasterwork = quality >= 90;
      
      // Calculate value with quality multiplier and masterwork bonus
      const baseValue = itemData?.value || 0;
      const qualityAdjustedValue = Math.round(baseValue * (quality / 100));
      const finalValue = isMasterwork 
        ? Math.round(qualityAdjustedValue * 1.25) 
        : qualityAdjustedValue;

      setProcessingResult({
        item: selectedItem,
        type: selectedType,
        quality,
        qualityLevel: active.qualityLevel,
        baseValue,
        qualityAdjustedValue,
        finalValue,
        isMasterwork,
      });

      // Complete the process
      dispatch({
        type: COMPLETE_ACTIVE_PROCESS,
        payload: { quality }
      });

      setStep('result');
    }
  }, [state.processState?.activeProcess, step, selectedItem, selectedType, dispatch]);

  const handleBack = () => {
    if (step === 'type') {
      setStep('select');
      setSelectedItem(null);
    } else if (step === 'quality') {
      setStep('type');
      setSelectedType(null);
    }
  };

  const handleDone = () => {
    // Reset state
    setStep('select');
    setSelectedItem(null);
    setSelectedType(null);
    setSelectedQuality(null);
    setProcessingResult(null);
  };

  const getAvailableTypes = () => {
    if (!selectedItem) return [];
    return PROCESS_TYPES.filter(type => {
      if (type.id === 'cleaning') return selectedItem.canClean;
      if (type.id === 'cutting') return selectedItem.canCut;
      if (type.id === 'faceting') return selectedItem.canFacet;
      return false;
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-amber-400">
            {step === 'select' && 'Select Item to Process'}
            {step === 'type' && 'Select Process Type'}
            {step === 'quality' && 'Select Quality Level'}
            {step === 'processing' && 'Processing...'}
            {step === 'result' && 'Processing Complete!'}
          </h3>
          {step !== 'select' && step !== 'processing' && step !== 'result' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Content */}
        {step === 'select' && (
          <ItemSelection items={itemsWithData} onSelect={handleSelectItem} />
        )}
        {step === 'type' && selectedItem && (
          <TypeSelection
            item={selectedItem}
            types={getAvailableTypes()}
            onSelect={handleSelectType}
          />
        )}
        {step === 'quality' && selectedItem && selectedType && (
          <QualitySelection
            item={selectedItem}
            type={selectedType}
            onSelect={handleSelectQuality}
            isOnCooldown={isOnCooldown}
            getCooldownRemaining={getCooldownRemaining}
          />
        )}
        {step === 'processing' && (
          <ProcessingSpinner item={selectedItem} type={selectedType} />
        )}
        {step === 'result' && processingResult && (
          <ResultDisplay result={processingResult} onDone={handleDone} />
        )}

        {/* Empty State */}
        {step === 'select' && itemsWithData.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <GemIcon className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No items available to process.</p>
            <p className="text-sm mt-2">Visit Discover to find some gems!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemSelection({ items, onSelect }) {
  // Quality badge color based on quality percentage
  const getQualityColor = (quality) => {
    if (quality === undefined || quality === null) return 'text-gray-500';
    if (quality >= 90) return 'text-yellow-400';
    if (quality >= 75) return 'text-green-400';
    if (quality >= 60) return 'text-blue-400';
    return 'text-gray-400';
  };

  const formatQuality = (quality) => {
    if (quality === undefined || quality === null) return '?';
    return `${Math.round(quality)}%`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map(item => {
        const ItemIcon = item.Icon;
        const qualityColor = getQualityColor(item.quality);
        const isUnprocessed = item.quality === undefined || item.quality === null;
        return (
          <button
            key={item.stackId}
            onClick={() => onSelect(item)}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
              isUnprocessed 
                ? 'bg-slate-800 border-slate-600 hover:border-amber-500' 
                : 'bg-slate-700 border-slate-500 hover:border-amber-500'
            }`}
          >
            <ItemIcon className="text-2xl text-cyan-400" />
            <div className="text-sm text-white text-center">{item.displayName}</div>
            <div className="text-xs text-gray-400">x{item.quantity}</div>
            <div className={`text-xs font-medium ${qualityColor}`}>
              Q: {formatQuality(item.quality)}
            </div>
            <div className={`text-xs font-medium ${RARITY_COLORS[item.rarity]}`}>
              {item.rarity}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TypeSelection({ item, types, onSelect }) {
  const ItemIcon = item.Icon;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-4">
        <ItemIcon className="text-3xl text-cyan-400" />
        <div>
          <div className="text-white font-medium">{item.displayName}</div>
          <div className="text-gray-400 text-sm">
            {item.category} • {item.rarity}
          </div>
        </div>
      </div>

      <div className="text-gray-400 text-sm">Choose a process type:</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {types.map(type => {
          const TypeIcon = type.Icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 border border-slate-600 hover:border-amber-500 transition-all"
            >
              <TypeIcon className="text-2xl text-amber-400" />
              <div className="text-white font-medium">{type.label}</div>
              <div className="text-gray-400 text-xs text-center">{type.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QualitySelection({ item, type, onSelect, isOnCooldown, getCooldownRemaining }) {
  const ItemIcon = item.Icon;
  const TypeIcon = type.Icon;
  
  return (
    <div className="flex flex-col gap-4">
      {/* Item and Type Info */}
      <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-4">
        <ItemIcon className="text-2xl text-cyan-400" />
        <div className="flex-1">
          <div className="text-white font-medium">{item.displayName}</div>
          <div className="text-gray-400 text-sm flex items-center gap-2">
            <TypeIcon className="text-amber-400" />
            {type.label}
          </div>
        </div>
      </div>

      <div className="text-gray-400 text-sm">Choose quality level:</div>

      {/* Quality Level Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {QUALITY_LEVELS.map(level => {
          const LevelIcon = level.icon;
          const onCooldown = isOnCooldown(item.id, level.id);
          const remaining = getCooldownRemaining(item.id, level.id);
          const btnClass = onCooldown 
            ? COOLDOWN_COLORS[level.id]
            : QUALITY_COLORS[level.id];
          
          return (
            <button
              key={level.id}
              onClick={() => !onCooldown && onSelect(level.id)}
              disabled={onCooldown}
              className={`flex items-center gap-4 p-4 rounded-lg font-semibold transition-all ${btnClass}`}
            >
              <LevelIcon className="text-xl text-white" />
              <div className="flex-1 text-left">
                <div className="text-white font-bold">{level.label} Quality</div>
                <div className="text-sm opacity-75">{level.description}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{level.cooldown}s</div>
                <div className="text-xs opacity-75">cooldown</div>
              </div>
              {onCooldown && (
                <div className="ml-2 text-white font-bold">
                  {remaining}s
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProcessingSpinner({ item, type }) {
  const ItemIcon = item.Icon;
  const TypeIcon = type.Icon;
  
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative">
        <div className="animate-spin">
          <FaSpinner className="text-6xl text-amber-400" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ItemIcon className="text-2xl text-cyan-400 animate-pulse" />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-white text-xl font-bold mb-1">
          Processing {item.displayName}
        </div>
        <div className="text-gray-400 flex items-center justify-center gap-2">
          <TypeIcon className="text-amber-400" />
          {type.label}
        </div>
      </div>
      
      <div className="text-gray-500 text-sm">
        Calculating quality...
      </div>
    </div>
  );
}

function ResultDisplay({ result, onDone }) {
  const qualityColor = result.isMasterwork 
    ? 'text-yellow-400' 
    : result.quality >= 70 
      ? 'text-green-400' 
      : 'text-gray-400';
  
  const ItemIcon = result.item.Icon;
  const TypeIcon = result.type.Icon;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Item Display */}
      <div className="relative">
        <ItemIcon className="text-6xl text-cyan-400 animate-pulse" />
        {result.isMasterwork && (
          <div className="absolute -top-2 -right-2 animate-bounce">
            <FaStar className="text-3xl text-yellow-400" />
          </div>
        )}
      </div>

      {/* Result Info */}
      <div className="bg-slate-800 rounded-xl p-6 w-full">
        <div className="text-white text-xl font-bold mb-1">{result.item.displayName}</div>
        <div className="text-gray-400 text-sm flex items-center justify-center gap-2 mb-4">
          <TypeIcon className="text-amber-400" />
          {result.type.label} Complete!
        </div>

        {/* Quality Display */}
        <div className="mb-4">
          <div className="text-gray-400 text-sm mb-1">Quality</div>
          <div className={`text-4xl font-bold ${qualityColor}`}>
            {Math.round(result.quality)}%
          </div>
          <div className="text-xs text-gray-500 capitalize mt-1">
            {result.qualityLevel} quality level
          </div>
        </div>

        {/* Value Breakdown */}
        <div className="bg-slate-900 rounded-lg p-4 mb-4">
          <div className="text-gray-400 text-xs mb-2">Value Calculation</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Value:</span>
              <span className="text-white">{result.baseValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Quality Multiplier:</span>
              <span className="text-white">×{(result.quality / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">After Quality:</span>
              <span className="text-green-400">{result.qualityAdjustedValue}</span>
            </div>
            {result.isMasterwork && (
              <>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Masterwork Bonus:</span>
                  <span className="text-yellow-400">×1.25</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-yellow-400">Final Value:</span>
                  <span className="text-yellow-400">{result.finalValue}</span>
                </div>
              </>
            )}
            {!result.isMasterwork && (
              <div className="flex justify-between font-bold">
                <span className="text-green-400">Final Value:</span>
                <span className="text-green-400">{result.finalValue}</span>
              </div>
            )}
          </div>
        </div>

        {result.isMasterwork && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <div className="text-yellow-400 font-bold flex items-center justify-center gap-2">
              <FaStar /> Masterwork! <FaStar />
            </div>
            <div className="text-yellow-200 text-sm mt-1">
              Exceptional craftsmanship! +25% bonus value applied.
            </div>
          </div>
        )}
      </div>

      {/* Done Button */}
      <button
        onClick={onDone}
        className="px-8 py-3 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-400 transition-colors"
      >
        Done
      </button>
    </div>
  );
}
