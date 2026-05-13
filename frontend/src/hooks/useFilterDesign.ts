import { useTabStore } from "../store/tabStore";
import { designFilter } from "../api/filterApi";

export function useFilterDesign(tabId: string) {
  const { updateRequest, setLoading, setResult, setError } = useTabStore();

  const run = async (request: Parameters<typeof designFilter>[0]) => {
    setLoading(tabId, true);
    setError(tabId, null);
    try {
      const result = await designFilter(request);
      setResult(tabId, result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(tabId, message);
    } finally {
      setLoading(tabId, false);
    }
  };

  return { run, updateRequest };
}