/**
 * Custom hook to fetch data directly from Supabase
 * This bypasses Refine's useList hook which has issues with RLS policies
 * 
 * Usage:
 * const { data, isLoading, error, refetch } = useSupabaseList('ai_models', {
 *   orderBy: { field: 'name', ascending: true }
 * });
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface UseSupabaseListOptions {
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
    value: any;
  }>;
  orderBy?: {
    field: string;
    ascending?: boolean;
  } | Array<{
    field: string;
    ascending?: boolean;
  }>;
  limit?: number;
  offset?: number;
}

export function useSupabaseList<T = any>(
  tableName: string,
  options: UseSupabaseListOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName).select("*");

      // Apply filters
      if (options.filters) {
        options.filters.forEach((filter) => {
          switch (filter.operator) {
            case "eq":
              query = query.eq(filter.field, filter.value);
              break;
            case "neq":
              query = query.neq(filter.field, filter.value);
              break;
            case "gt":
              query = query.gt(filter.field, filter.value);
              break;
            case "gte":
              query = query.gte(filter.field, filter.value);
              break;
            case "lt":
              query = query.lt(filter.field, filter.value);
              break;
            case "lte":
              query = query.lte(filter.field, filter.value);
              break;
            case "like":
              query = query.like(filter.field, filter.value);
              break;
            case "ilike":
              query = query.ilike(filter.field, filter.value);
              break;
            case "in":
              query = query.in(filter.field, filter.value);
              break;
            case "is":
              query = query.is(filter.field, filter.value);
              break;
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          options.orderBy.forEach((order, index) => {
            if (index === 0) {
              query = query.order(order.field, {
                ascending: order.ascending !== false,
              });
            } else {
              // Supabase doesn't support multiple orderBy in a single call
              // We'll handle this in the application layer if needed
            }
          });
        } else {
          query = query.order(options.orderBy.field, {
            ascending: options.orderBy.ascending !== false,
          });
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, JSON.stringify(options), supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}








