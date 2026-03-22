interface PlayerData {
  peerId: string;
  name: string;
  checkedCount: number;
  isMe: boolean;
}

interface PlayerListProps {
  players: PlayerData[];
  totalTiles: number;
}

function PlayerList({ players, totalTiles }: PlayerListProps) {
  if (!players || players.length === 0) {
    return null;
  }

  // Sort players by completion level (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    // First sort by checked count (descending)
    const countDiff = b.checkedCount - a.checkedCount;
    if (countDiff !== 0) return countDiff;

    // If same count, put current player first
    if (a.isMe) return -1;
    if (b.isMe) return 1;

    // Otherwise sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="player-list-container">
      <h3 className="player-list-title">Active Players ({players.length})</h3>
      <div className="player-list">
        {sortedPlayers.map((player) => {
          const progressPercent =
            totalTiles > 0
              ? Math.round((player.checkedCount / totalTiles) * 100)
              : 0;
          const isCompleted = player.checkedCount === totalTiles;

          return (
            <div
              key={player.peerId}
              className={`player-item ${player.isMe ? "current-player" : ""} ${isCompleted ? "completed-player" : ""}`}
            >
              <div className="player-info">
                <span className="player-name">
                  {player.isMe && <span className="player-icon star">⭐</span>}
                  {player.name}
                  {isCompleted && <span className="player-icon crown">👑</span>}
                  {player.isMe && <span className="you-badge"> (You)</span>}
                </span>
                <span className="player-progress">
                  {player.checkedCount} / {totalTiles} ({progressPercent}%)
                </span>
              </div>
              <div className="player-progress-bar">
                <div
                  className="player-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {players.length >= 6 && (
        <p className="player-list-note">Maximum players reached (6)</p>
      )}
    </div>
  );
}

export default PlayerList;
