import { useGame } from '../../../context/GameContext';

export function useDiscover() {
  const { state, dispatch } = useGame();
  const { discoverState } = state;

  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_DISCOVER_TAB', payload: tab });
  };

  const selectLocation = (locationId) => {
    dispatch({ type: 'SELECT_LOCATION', payload: locationId });
  };

  const selectArea = (areaId) => {
    dispatch({ type: 'SELECT_AREA', payload: areaId });
  };

  const setRewards = (rewards) => {
    dispatch({ type: 'SET_REWARDS', payload: rewards });
  };

  const clearRewards = () => {
    dispatch({ type: 'CLEAR_REWARDS' });
  };

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_DISCOVER_SELECTION' });
  };

  return {
    discoverState,
    setActiveTab,
    selectLocation,
    selectArea,
    setRewards,
    clearRewards,
    clearSelection,
  };
}
