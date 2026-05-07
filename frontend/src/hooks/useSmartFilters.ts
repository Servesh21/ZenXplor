import { useState } from "react";

export interface FilterState {
  modifiedAfter:  string;  // "YYYY-MM-DD" or ""
  modifiedBefore: string;  // "YYYY-MM-DD" or ""
  sizeMin:        string;  // bytes as string or ""
  sizeMax:        string;  // bytes as string or ""
  filetype:       string;  // existing filter
  service:        string;  // existing filter
}

const DEFAULT_FILTERS: FilterState = {
  modifiedAfter:  "",
  modifiedBefore: "",
  sizeMin:        "",
  sizeMax:        "",
  filetype:       "",
  service:        "",
};

export function useSmartFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function hasActiveFilters(): boolean {
    return Object.values(filters).some(v => v !== "");
  }

  /** Count of active (non-empty) filter values */
  function activeFilterCount(): number {
    return Object.values(filters).filter(v => v !== "").length;
  }

  /** Build query params object to append to search requests */
  function toQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (filters.modifiedAfter)  params.modified_after  = filters.modifiedAfter;
    if (filters.modifiedBefore) params.modified_before = filters.modifiedBefore;
    if (filters.sizeMin)        params.size_min        = filters.sizeMin;
    if (filters.sizeMax)        params.size_max        = filters.sizeMax;
    if (filters.filetype)       params.filetype        = filters.filetype;
    if (filters.service)        params.service         = filters.service;
    return params;
  }

  return { filters, updateFilter, resetFilters, hasActiveFilters, activeFilterCount, toQueryParams };
}
