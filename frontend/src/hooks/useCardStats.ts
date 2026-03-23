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
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, error, reload: loadStats };
}
