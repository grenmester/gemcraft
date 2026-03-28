import { useGame as useGameContext } from '../../context/GameContext';

export function useGame() {
  const { state, dispatch } = useGameContext();
  return { gameState: state, dispatch };
}
