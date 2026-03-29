import { useState, useMemo } from 'react';
import { useGame } from '../../../context/GameContext';
import { useProcess } from '../hooks/useProcess';
import { getItemById } from '../../../data/items';
import { FaGem, FaTools, FaCut, FaCog, FaArrowLeft, FaStar, FaMapMarkedAlt, FaMountain } from 'react-icons/fa';

const PROCESS_TYPES = [
  { id: 'cleaning', label: 'Cleaning', description: 'Tumble and clean the item', Icon: FaTools },
  { id: 'cutting', label: 'Cutting', description: 'Shape and cut the facets', Icon: FaCut },
  { id: 'faceting', label: 'Faceting', description: 'Polish and facet for brilliance', Icon: FaCog },
];

const RARITY_COLORS = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
};

const CATEGORY_ICONS = {
  Gem: FaGem,
  Mineral: FaMountain,
};

export default function ProcessSelector() {
  const { state, dispatch } = useGame();
  const { availableItems } = useProcess();
  const [step, setStep] = useState('select'); // 'select' | 'type' | 'result'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [result, setResult] = useState(null);

  const itemsWithData = useMemo(() => {
    return availableItems.map(invItem => {
      const itemData = getItemById(invItem.id);
      const Icon = CATEGORY_ICONS[itemData?.category] || FaGem;
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

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setStep('type');
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    processItem(type);
  };

  const processItem = (type) => {
    if (!selectedItem) return;

    const baseQuality = 50 + Math.random() * 40;
    const qualityBonus = calculateQualityBonus(type.id);
    const finalQuality = Math.min(110, baseQuality + qualityBonus);
    const valueMultiplier = finalQuality / 100;
    const newValue = Math.round(selectedItem.value * valueMultiplier);

    setResult({
      item: selectedItem,
      type,
      quality: Math.round(finalQuality),
      baseValue: selectedItem.value,
      newValue,
      isMasterwork: finalQuality >= 90,
      rarity: selectedItem.rarity,
    });
    setStep('result');
  };

  const handleBack = () => {
    if (step === 'type') {
      setStep('select');
      setSelectedItem(null);
    } else if (step === 'result') {
      setStep('type');
      setResult(null);
    }
  };

  const handleDone = () => {
    setStep('select');
    setSelectedItem(null);
    setSelectedType(null);
    setResult(null);
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
            {step === 'result' && 'Processing Complete!'}
          </h3>
          {step !== 'select' && (
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
        {step === 'result' && result && (
          <ResultDisplay result={result} onDone={handleDone} />
        )}

        {/* Empty State */}
        {step === 'select' && itemsWithData.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FaGem className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No items available to process.</p>
            <p className="text-sm mt-2">Visit Discover to find some gems!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemSelection({ items, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map(item => {
        const ItemIcon = item.Icon;
        return (
          <button
            key={`${item.id}-${item.type}`}
            onClick={() => onSelect(item)}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 border border-slate-600 hover:border-amber-500 transition-all"
          >
            <ItemIcon className="text-2xl text-cyan-400" />
            <div className="text-sm text-white text-center">{item.displayName}</div>
            <div className="text-xs text-gray-400">x{item.quantity}</div>
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

function ResultDisplay({ result, onDone }) {
  const qualityColor = result.quality >= 90 ? 'text-yellow-400' : result.quality >= 70 ? 'text-green-400' : 'text-gray-400';
  const ItemIcon = result.item.Icon;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Item Display */}
      <div className="relative">
        <ItemIcon className="text-6xl text-cyan-400 animate-pulse" />
        {result.isMasterwork && (
          <div className="absolute -top-2 -right-2">
            <FaStar className="text-2xl text-yellow-400" />
          </div>
        )}
      </div>

      {/* Result Info */}
      <div className="bg-slate-800 rounded-xl p-6 w-full">
        <div className="text-white text-xl font-bold mb-2">{result.item.displayName}</div>
        <div className="text-gray-400 text-sm mb-4">{result.type.label} Complete!</div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-sm">Quality</div>
            <div className={`text-3xl font-bold ${qualityColor}`}>{result.quality}%</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Value</div>
            <div className="text-green-400 text-2xl font-bold flex items-center justify-center gap-1">
              {result.newValue}
              <FaGem className="text-yellow-400 text-sm" />
            </div>
          </div>
        </div>

        {result.isMasterwork && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <div className="text-yellow-400 font-bold flex items-center justify-center gap-2">
              <FaStar /> Masterwork! <FaStar />
            </div>
            <div className="text-yellow-200 text-sm mt-1">
              Exceptional craftsmanship! Bonus value applied.
            </div>
          </div>
        )}

        <div className="text-gray-500 text-sm">
          Value increased from {result.baseValue} to {result.newValue}
        </div>
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
