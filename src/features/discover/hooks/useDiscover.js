import { useGame } from '../../../context/GameContext';
import { SET_DISCOVER_TAB } from '../../../context/GameContext';

export function useDiscover() {
  const { state, dispatch } = useGame();
  const discoverState = state.discoverState || {};

  const setActiveTab = (tab) => {
    dispatch({ type: SET_DISCOVER_TAB, payload: tab });
  };

  return {
    discoverState,
    setActiveTab,
  };
}
