
import api from "./axios";

export const reconciliationApi = {

  // Upload invoices CSV
  uploadInvoices: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/import/invoices", formData);
  },

  // Upload payments CSV
  uploadPayments: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/import/payments", formData);
  },

  // Trigger matching engine
  runMatching: () =>
    api.post("/reconciliation/match"),

  // Get suggestions
  getSuggestions: (params = {}) =>
    api.get("/reconciliation/suggestions", {
      params: {
        status: "PENDING",
        ...params
      }
    }),

  // Confirm suggestion
  confirmSuggestion: (id, payload) =>
    api.post(
      `/reconciliation/suggestions/${id}/confirm`,
      payload
    ),

  // Reject suggestion
  rejectSuggestion: (id, payload) =>
    api.post(
      `/reconciliation/suggestions/${id}/reject`,
      payload
    ),

  // Manual allocation
  createAllocation: (payload) =>
    api.post(
      "/reconciliation/allocations",
      payload
    ),

  // Reverse allocation
  reverseAllocation: (id, note) =>
    api.delete(
      `/reconciliation/allocations/${id}`,
      { params: { note } }
    ),

  // Fetch balances
  getBalances: () =>
    api.get("/reconciliation/balances"),

  // Download reconciliation report
  downloadReport: () =>
    api.get("/reconciliation/report", {
      responseType: "blob"
    })
};
