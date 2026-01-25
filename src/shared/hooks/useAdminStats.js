import { useState, useEffect, useCallback } from "react";
import { AdminService } from "../../services/AdminService";

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    mrr: 0,
    activeSubscriptions: 0,
  });
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, businessesData, statsData] = await Promise.all([
        AdminService.getUsers(),
        AdminService.getBusinesses(),
        AdminService.getStats(),
      ]);

      // Safely extract data regardless of return format ({ data: ... } vs Array)
      const resolvedUsers =
        usersData.data || (Array.isArray(usersData) ? usersData : []);
      const resolvedBusinesses =
        businessesData.data ||
        (Array.isArray(businessesData) ? businessesData : []);
      const resolvedStats = statsData.data ||
        statsData || {
          totalUsers: 0,
          totalBusinesses: 0,
          mrr: 0,
          activeSubscriptions: 0,
        };

      setUsers(resolvedUsers);
      setBusinesses(resolvedBusinesses);
      setStats(resolvedStats);
    } catch (e) {
      console.error("Dashboard Load Failed", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Realtime Subscription
    const channel = AdminService.subscribeToDashboardEvents(() => {
      console.log(
        "⚡ Synergy: Realtime Event Detected, Refreshing Dashboard...",
      );
      loadData();
    });

    return () => {
      if (channel) AdminService.unsubscribe(channel);
    };
  }, [loadData]);

  const handleUserAction = async (type, user) => {
    if (type === "ban") {
      try {
        await AdminService.toggleUserBan(user.id);
        await loadData();
        return true;
      } catch (e) {
        console.error("Failed to toggle user ban", e);
        return false;
      }
    }
  };

  const handleBusinessAction = async (type, business) => {
    if (type === "verify") {
      try {
        await AdminService.toggleBusinessVerification(business.id);
        await loadData();
        return true;
      } catch (e) {
        console.error("Failed to toggle business verification", e);
        return false;
      }
    }
  };

  return {
    stats,
    users,
    businesses,
    loading,
    error,
    refresh: loadData,
    handleUserAction,
    handleBusinessAction,
  };
}
