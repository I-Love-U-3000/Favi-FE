import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  SearchRequest,
  SearchResult,
  SemanticSearchRequest,
} from "@/types";

export const searchAPI = {
  /**
   * Regular search - returns posts and tags matching the query
   * POST /search
   */
  search: (payload: SearchRequest) =>
    fetchWrapper.post<SearchResult>("/search", payload, false),

  /**
   * Semantic search - AI-powered search using embeddings
   * Requires authentication
   * POST /search/semantic
   */
  semanticSearch: (payload: SemanticSearchRequest) =>
    fetchWrapper.post<SearchResult>("/search/semantic", payload),

  /**
   * Legacy search method (kept for backward compatibility)
   * @deprecated Use search() or semanticSearch() instead
   */
  legacySearch: (payload: {
    keyword: string;
    filters?: Record<string, any>;
    page?: number;
    pageSize?: number;
  }) => fetchWrapper.post<any>("/search", payload, false),
};

export default searchAPI;
