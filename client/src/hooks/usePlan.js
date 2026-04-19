import { useState, useEffect } from "react";
import api from "../lib/api";
import useAuthStore from "../store/authStore";

const FREE_LIMITS = {
  clients: 5,
  invoices: 10,
  projects: 5,
  leads: 20,
  tasks: 20,
  contacts: 20,
  contracts: 5,
  expenses: 10
};

export default function usePlan() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState({});
  const [currentCounts, setCurrentCounts] = useState({});

  const isPro = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date();

  useEffect(() => {
    fetchPlanStatus();
  }, []);

  const fetchPlanStatus = async () => {
    try {
      const res = await api.get("/subscribe/status");
      if (res.data?.data) {
        setLimits(res.data.data.limits?.free || FREE_LIMITS);
      }
    } catch (err) {
      setLimits(FREE_LIMITS);
    }
    setLoading(false);
  };

  const getRemaining = (resource) => {
    if (isPro) return 'unlimited';
    
    const limit = limits[resource] || FREE_LIMITS[resource] || 0;
    const current = currentCounts[resource] || 0;
    const remaining = limit - current;
    
    return remaining > 0 ? remaining : 0;
  };

  const hasReachedLimit = (resource) => {
    if (isPro) return false;
    
    const remaining = getRemaining(resource);
    return remaining === 0 || typeof remaining === 'string';
  };

  const getUsage = (resource) => {
    if (isPro) return { used: 'unlimited', limit: 'unlimited', remaining: 'unlimited' };
    
    const limit = limits[resource] || FREE_LIMITS[resource] || 0;
    const used = currentCounts[resource] || 0;
    const remaining = limit - used;
    
    return {
      used,
      limit,
      remaining: remaining > 0 ? remaining : 0
    };
  };

  return {
    isPro,
    isLoading: loading,
    limits: isPro ? 'unlimited' : limits,
    getRemaining,
    hasReachedLimit,
    getUsage,
    FREE_LIMITS
  };
}