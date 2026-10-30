
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState
} from "react";

import { reconciliationApi } from "../api/reconciliationApi";

const ReconciliationContext = createContext(null);

export function ReconciliationProvider({ children }) {
  const [suggestions, setSuggestions] = useState([]);
  const [balances, setBalances] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [suggestionResponse, balanceResponse] =
        await Promise.all([
          reconciliationApi.getSuggestions({
            status: "PENDING"
          }),
          reconciliationApi.getBalances()
        ]);

      const suggestionData = suggestionResponse.data;
      const balanceData = balanceResponse.data;

      setSuggestions(
        Array.isArray(suggestionData)
          ? suggestionData
          : suggestionData?.suggestions || []
      );

      setBalances(balanceData);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [refreshData]);

  // Every successful mutation refreshes both datasets.
  const mutateAndRefresh = async (mutation) => {
    setError("");

    const response = await mutation();

    await refreshData();

    return response;
  };

  const confirmSuggestion = (id, amount, note) =>
    mutateAndRefresh(() =>
      reconciliationApi.confirmSuggestion(id, {
        amount: Number(amount),
        note
      })
    );

  const rejectSuggestion = (id, note) =>
    mutateAndRefresh(() =>
      reconciliationApi.rejectSuggestion(id, {
        note
      })
    );

  const createAllocation = (payload) =>
    mutateAndRefresh(() =>
      reconciliationApi.createAllocation(payload)
    );

  const reverseAllocation = (id, note) =>
    mutateAndRefresh(() =>
      reconciliationApi.reverseAllocation(id, note)
    );

  const value = {
    suggestions,
    balances,
    loading,
    error,
    refreshData,
    confirmSuggestion,
    rejectSuggestion,
    createAllocation,
    reverseAllocation
  };

  return (
    <ReconciliationContext.Provider value={value}>
      {children}
    </ReconciliationContext.Provider>
  );
}

export function useReconciliation() {
  const context = useContext(ReconciliationContext);

  if (!context) {
    throw new Error(
      "useReconciliation must be used inside ReconciliationProvider"
    );
  }

  return context;
}
