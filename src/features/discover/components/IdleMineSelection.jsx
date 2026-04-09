import { useState, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { COLLECT_PENDING_MATERIALS } from '../../../context/GameContext';
import { FaUsers, FaHourglassHalf, FaGem, FaCoins, FaUserPlus } from 'react-icons/fa';

const TICK_INTERVAL = 60000;

export default function IdleMineSelection() {
  const { state, dispatch } = useGame();
  const workers = state.player?.workers || [];
  const pendingMaterials = state.discoverState?.pendingMaterials || {};
  const [tickTime, setTickTime] = useState(TICK_INTERVAL);
  
  const assignedWorkers = workers.filter(w => w.assignedArea);
  const idleWorkers = workers.filter(w => !w.assignedArea);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTickTime(prev => prev <= 1000 ? TICK_INTERVAL : prev - 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleCollect = (mineId) => {
    dispatch({ type: COLLECT_PENDING_MATERIALS, payload: { mineId } });
  };
  
  const handleGoToWorkers = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.WORKERS });
  };
  
  const getPendingCount = (mineId) => {
    const pending = pendingMaterials[mineId] || [];
    return pending.reduce((sum, m) => sum + m.quantity, 0);
  };
  
  const formatTime = (ms) => {
    return Math.ceil(ms / 1000) + 's';
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaUsers className="text-yellow-400" /> Workers Overview
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-white">{workers.length}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-400">{assignedWorkers.length}</p>
            <p className="text-xs text-slate-400">Assigned</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-2xl font-bold text-yellow-400">{idleWorkers.length}</p>
            <p className="text-xs text-slate-400">Idle</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white flex items-center gap-2">
            <FaHourglassHalf className="text-yellow-400" /> Next Generation
          </h3>
          <span className="text-yellow-400 font-mono">{formatTime(tickTime)}</span>
        </div>
        
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${((TICK_INTERVAL - tickTime) / TICK_INTERVAL) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-slate-500 mt-2">Workers generate materials every minute</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white flex items-center gap-2">
            <FaGem className="text-yellow-400" /> Workers & Pending
          </h3>
        </div>
        
        {workers.length === 0 ? (
          <div className="text-center py-8">
            <FaUserPlus className="mx-auto text-slate-600 text-4xl mb-4" />
            <p className="text-slate-400 mb-2">No workers hired yet.</p>
            <p className="text-slate-500 text-sm mb-4">Workers generate materials while you&apos;re away.</p>
            <button
              onClick={handleGoToWorkers}
              className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Hire Workers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map(w => {
              const pending = getPendingCount(w.assignedArea || '');
              const isAssigned = !!w.assignedArea;
              
              return (
                <div key={w.id} className={`bg-slate-700 rounded-lg p-4 ${
                  !isAssigned ? 'border-l-4 border-yellow-500' : ''
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">{w.workerTypeId}</p>
                      <p className="text-slate-400 text-sm">
                        {isAssigned ? `Assigned to: ${w.assignedArea}` : 'No assignment'}
                      </p>
                    </div>
                    <span className="text-slate-400 text-sm">Lv.{w.level}</span>
                  </div>
                  
                  {isAssigned ? (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-500">
                        Pending: {pending} items
                      </span>
                      <button
                        onClick={() => handleCollect(w.assignedArea)}
                        disabled={pending === 0}
                        className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                          pending > 0
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                            : 'bg-slate-600 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Collect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoToWorkers}
                      className="w-full mt-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Assign to Mine →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {assignedWorkers.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-white flex items-center gap-2">
              <FaCoins className="text-yellow-400" /> Total Pending
            </h3>
            <button
              onClick={() => {
                assignedWorkers.forEach(w => {
                  if (w.assignedArea) handleCollect(w.assignedArea);
                });
              }}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Collect All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {assignedWorkers.map(w => {
              const pending = getPendingCount(w.assignedArea || '');
              return (
                <div key={w.id} className="bg-slate-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 truncate">{w.assignedArea}</p>
                  <p className="text-xl font-bold text-white">{pending}</p>
                  <p className="text-xs text-slate-500">items</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
