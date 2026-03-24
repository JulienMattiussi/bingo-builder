import { useState, useEffect } from "react";
import { api } from "../utils/api";

interface CardStats {
  published: number;
  unpublished: number;
  maxPublished: number;
  maxUnpublished: number;
  canCreate: boolean;
  canPublish: boolean;
}

export function useCardStats() {
  const [stats, setStats] = useState<CardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCardStats();
      setStats(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Failed to load card stats:", err);
      // On error, set permissive defaults (allow all actions)
      setStats({
        published: 0,
        unpublished: 0,
        maxPublished: 50,
        maxUnpublished: 50,
        canCreate: true,
        canPublish: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load stats but don't block if it fails
    loadStats().catch(console.error);
  }, []);

  return { stats, loading, error, reload: loadStats };
}
