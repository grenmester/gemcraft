import { useGame } from './useGame';

export function usePlayer() {
  const { gameState } = useGame();
  return gameState.player;
}
