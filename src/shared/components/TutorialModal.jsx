/**
 * TutorialModal Component
 * Reusable onboarding/tutorial overlay for game mechanics
 */

import { useState, useEffect } from 'react';
import { FaQuestionCircle, FaTimes, FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';

export function TutorialModal({ isOpen, onClose, title, sections }) {
  const [currentPage, setCurrentPage] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const totalPages = sections.length;
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;
  const currentSection = sections[currentPage];
  
  const handleNext = () => {
    if (isLastPage) {
      onClose();
    } else {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrev = () => {
    if (!isFirstPage) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl max-w-lg w-full border border-slate-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-700/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaQuestionCircle className="text-amber-400 text-xl" />
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-3 bg-slate-800/50">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentPage 
                  ? 'bg-amber-400 w-4' 
                  : 'bg-slate-600 hover:bg-slate-500'
                }
              `}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="min-h-[280px]">
            {currentSection.icon && (
              <div className="text-center mb-4">
                <span className="text-5xl">{currentSection.icon}</span>
              </div>
            )}
            
            <h3 className="text-xl font-bold text-amber-400 text-center mb-3">
              {currentSection.title}
            </h3>
            
            <p className="text-slate-300 leading-relaxed mb-4">
              {currentSection.content}
            </p>
            
            {currentSection.tips && currentSection.tips.length > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                <div className="text-sm font-semibold text-cyan-400 mb-2">
                  💡 Tips
                </div>
                <ul className="space-y-2">
                  {currentSection.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-700/30 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstPage}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${isFirstPage 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }
            `}
          >
            <FaChevronLeft /> Back
          </button>
          
          <div className="text-sm text-slate-400">
            {currentPage + 1} / {totalPages}
          </div>
          
          <button
            onClick={handleNext}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${isLastPage
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
              }
            `}
          >
            {isLastPage ? (
              <>Got it! <FaCheck /></>
            ) : (
              <>Next <FaChevronRight /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Help Button Component
 * Floating button to open tutorial
 */
export function HelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 w-10 h-10 bg-slate-700/80 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg z-10"
      title="Help"
    >
      <FaQuestionCircle className="text-lg" />
    </button>
  );
}

/**
 * Discover Tutorial Content
 */
export const DISCOVER_TUTORIAL_SECTIONS = [
  {
    title: 'Welcome to Discover!',
    icon: '⛏️',
    content: 'Discover is where you find raw gems and minerals to process and sell. Choose from different mining locations with varying rarities and rewards.',
    tips: [
      'New locations unlock as you progress',
      'Higher tier locations have rarer gems',
      'Start with lower tiers to build your collection'
    ]
  },
  {
    title: 'Mining Locations',
    icon: '🗺️',
    content: 'Each mine is divided into three areas (A, B, C). Areas with higher letters contain rarer gems but have longer cooldowns between mining sessions.',
    tips: [
      'Area A: Common gems, short cooldown (5s)',
      'Area B: Uncommon gems, medium cooldown (15s)',
      'Area C: Rare gems, long cooldown (30s)'
    ]
  },
  {
    title: 'Mining Rewards',
    icon: '💎',
    content: 'Choose your reward size based on time and risk. Larger rewards give more items but have longer cooldowns before you can mine again.',
    tips: [
      'Small: 1 item, fastest cooldown',
      'Medium: 3 items, medium cooldown',
      'Large: 5 items, longest cooldown'
    ]
  },
  {
    title: 'Collecting Materials',
    icon: '📦',
    content: 'After mining, materials go to a pending area. Click "Collect" to add them to your inventory with a quality rating. Quality affects processing value!',
    tips: [
      'Quality ranges from 45% to 100%',
      'Higher tier mines = higher quality materials',
      'Collect before leaving the area'
    ]
  },
  {
    title: 'Idle Mining',
    icon: '⏰',
    content: 'The Idle tab shows automatic mining progress from workers. Collect accumulated materials periodically. Workers generate materials even while you\'re away!',
    tips: [
      'Check back regularly to collect',
      'Upgrades improve worker efficiency',
      'Offline progress is calculated on return'
    ]
  }
];

/**
 * Process Tutorial Content
 */
export const PROCESS_TUTORIAL_SECTIONS = [
  {
    title: 'Welcome to Process!',
    icon: '⚙️',
    content: 'Process transforms raw materials into valuable gems. Choose between Active processing (skill-based) or Idle queue (automatic).',
    tips: [
      'Processing increases gem value significantly',
      'Quality determines final gem worth',
      'Different tools affect speed and quality'
    ]
  },
  {
    title: 'Active Processing',
    icon: '🎮',
    content: 'Active processing lets you choose quality levels manually. Higher effort = higher potential quality, but with cooldowns.',
    tips: [
      'Low: Quick (3s), 40-60% quality',
      'Medium: Moderate (8s), 60-80% quality',
      'High: Slow (15s), 80-100% quality'
    ]
  },
  {
    title: 'Idle Queue',
    icon: '📋',
    content: 'Add materials to the queue and they\'ll process automatically. Great for when you\'re busy or have many items to process.',
    tips: [
      'Queue items for automatic processing',
      'Progress continues even when away',
      'Collect completed items when ready'
    ]
  },
  {
    title: 'Quality & Masterwork',
    icon: '✨',
    content: 'Quality determines gem value. Reach 90%+ quality for Masterwork status (×1.25 bonus). Idle processing caps at 85% - use Active for higher quality!',
    tips: [
      'Quality multiplies base gem value',
      'Masterwork (90%+) = 25% bonus',
      'Active is needed for 90%+ quality'
    ]
  },
  {
    title: 'Equipment',
    icon: '🔧',
    content: 'Upgrade your tools for better idle and active processing. Better equipment means faster processing and higher quality gems.',
    tips: [
      'Cleaning: Tumblers for matrix removal',
      'Cutting: Cutters for shaping gems',
      'Faceting: Faceters for final polish'
    ]
  }
];
