import { useState, useMemo, useEffect, Fragment } from 'react';
import Avatar from './Avatar';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X, ChevronRight, Loader2, Edit, Trash2 } from 'lucide-react';
import Pagination from './Pagination';
import { AuthProviderBadge, RoleBadge } from '@/lib/utils/badges';
import InsightCard from '@/components/features/insights/InsightCard';
import { Insight } from '@/types';

type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns?: ColumnConfig[];
  excludeFields?: string[];
  itemsPerPage?: number;
  onRowClick?: (row: T) => void;
  showPagination?: boolean;
  emptyMessage?: string;
  avatarField?: string;
  nameField?: string;
  statusField?: string;
  onFilterChange?: (filteredData: T[]) => void;
  showInsights?: boolean;
  insightsEndpoint?: (rowId: string) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  showActions?: boolean;
}

export function Table<T extends Record<string, any>>({
  data,
  columns: customColumns,
  excludeFields = ['id', 'createdAt', 'updatedAt', 'password', 'authProviderId', 'locationSource', 'locationUpdatedAt', 'latitude', 'longitude', 'memberIds', 'fingerprint', 'metadata', 'sourceId', 'tags'],
  itemsPerPage = 20,
  onRowClick,
  showPagination = true,
  emptyMessage = 'No data to display',
  avatarField = 'avatarUrl',
  nameField = 'name',
  statusField,
  onFilterChange,
  showInsights = false,
  insightsEndpoint,
  onEdit,
  onDelete,
  showActions = false
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>(nameField);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [rowInsights, setRowInsights] = useState<Record<string, { insights: Insight[]; loading: boolean }>>({});
  const [insightCounts, setInsightCounts] = useState<Record<string, number>>({});
  
  // Auto-generate columns from data if not provided
  const generatedColumns: ColumnConfig[] = useMemo(() => {
    if (customColumns) return customColumns;
    
    if (data.length === 0) return [];
    
    const sampleRow = data[0];
    const fields = Object.keys(sampleRow).filter(key => !excludeFields.includes(key));
    
    return fields.map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      sortable: true,
    }));
  }, [data, customColumns, excludeFields]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => 
    generatedColumns.map(col => col.key)
  );

  // Fetch insight counts for all rows upfront
  useEffect(() => {
    if (!showInsights || !insightsEndpoint || data.length === 0) return;

    const fetchAllInsightCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const row of data) {
        try {
          const response = await fetch(insightsEndpoint((row as any).id));
          if (response.ok) {
            try {
              const responseData = await response.json();
              const insights = responseData.insights || [];
              counts[(row as any).id] = insights.length;
            } catch (parseError) {
              // Failed to parse JSON, set count to 0
              counts[(row as any).id] = 0;
            }
          } else {
            // Non-200 response, set count to 0
            counts[(row as any).id] = 0;
          }
        } catch (error) {
          // Network error or other fetch error, set count to 0
          counts[(row as any).id] = 0;
        }
      }
      
      setInsightCounts(counts);
    };

    fetchAllInsightCounts();
  }, [showInsights, insightsEndpoint, data]);

  // Fetch insights for expanded row
  useEffect(() => {
    if (!showInsights || !expandedRowId || !insightsEndpoint) return;

    const rowData = data.find((row: any) => row.id === expandedRowId);
    if (!rowData) return;

    const fetchInsights = async () => {
      try {
        setRowInsights(prev => ({
          ...prev,
          [expandedRowId]: { insights: [], loading: true }
        }));

        const response = await fetch(insightsEndpoint(expandedRowId));
        if (response.ok) {
          const data = await response.json();
          const insights = data.insights || [];

          setRowInsights(prev => ({
            ...prev,
            [expandedRowId]: { insights, loading: false }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error);
        setRowInsights(prev => ({
          ...prev,
          [expandedRowId]: { insights: [], loading: false }
        }));
      }
    };

    fetchInsights();
  }, [expandedRowId, showInsights, insightsEndpoint, data]);

  const handleSort = (field: string) => {
    const column = generatedColumns.find(col => col.key === field);
    if (column?.sortable === false) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev =>
      prev.includes(field)
        ? prev.filter(col => col !== field)
        : [...prev, field]
    );
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    
    // Auto-detect onCall field from data structure
    const hasOnCallField = data.length > 0 && 'onCall' in data[0];
    
    // Special handling for on-call status searches - support partial matching
    // Detect variations: "on", "call", "on-call", "oncall", "on call", etc.
    const isOnCallSearch = query.includes('on') || query.includes('call');
    const isAvailableSearch = query.includes('available') || query.includes('avail');
    
    return data.filter(row => {
      // Handle on-call status filtering - automatically detect and apply
      if (hasOnCallField) {
        if (isOnCallSearch) {
          return (row as any).onCall === true;
        }
        if (isAvailableSearch) {
          return (row as any).onCall !== true;
        }
      }
      
      // Regular search through all visible columns
      return generatedColumns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        
        // Convert value to searchable string
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some(v => String(v).toLowerCase().includes(query));
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, generatedColumns]);

  // Notify parent when filtered data changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredData);
    }
  }, [filteredData, onFilterChange]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const renderCellValue = (column: ColumnConfig, row: T) => {
    const value = row[column.key];
    
    // Use custom render if provided
    if (column.render) {
      return column.render(value, row);
    }
    
    // Special rendering for name field with avatar
    if (column.key === nameField && avatarField) {
      const isOnCall = (row as any).onCall === true;
      return (
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Avatar
              src={row[avatarField]}
              alt={value || 'User'}
              size="md"
              className={`${isOnCall ? 'ring-2 ring-red-500 animate-ring-blink shadow-lg' : ''}`}
            />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {value || '-'}
            </div>
          </div>
        </div>
      );
    }
    
    // Render role badges
    if (column.key === 'role' && value) {
      const role = value as 'admin' | 'user' | 'viewer';
      return <RoleBadge role={role} size="sm" showIcon={true} />;
    }
    
    // Render color swatches
    if (column.key === 'color' && value) {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: value }}></span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
        </div>
      );
    }
    
    // Render auth provider badges
    if (column.key === 'authProvider' && value) {
      const provider = value as 'local' | 'oauth' | 'ldap';
      return <AuthProviderBadge provider={provider} size="sm" />;
    }
    
    // Default rendering
    if (value == null || value === '') return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    if (typeof value === 'object') return JSON.stringify(value);
    
    return String(value);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Column Visibility Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-medium text-gray-900 dark:text-white">{filteredData.length}</span> {filteredData.length === 1 ? 'result' : 'results'}
          {searchQuery && <span className="ml-1">for &quot;{searchQuery}&quot;</span>}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2 p-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center mr-2">
          Show columns:
        </span>
        <div className="flex flex-wrap gap-2">
          {generatedColumns.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() => toggleColumn(column.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                visibleColumns.includes(column.key)
                  ? 'bg-primary-500/40 dark:bg-primary-400/50 border border-primary-600/60 dark:border-primary-300/50 text-primary-900 dark:text-white font-semibold'
                  : 'bg-gray-300/50 dark:bg-gray-600/50 border border-gray-500/50 dark:border-gray-400/50 text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              style={{
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: visibleColumns.includes(column.key) 
                  ? 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                  : 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              {column.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100/50 dark:bg-gray-800/50">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {generatedColumns.filter(col => visibleColumns.includes(col.key)).map(column => (
                <th
                  key={column.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable !== false && <SortIcon field={column.key} />}
                  </div>
                </th>
              ))}
              {statusField && (
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center w-24">
                  Status
                </th>
              )}
              {showInsights && (
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center w-12">
                  Insights
                </th>
              )}
              {showActions && (
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, idx) => {
              const rowId = (row as any).id || idx;
              return (
                <Fragment key={rowId}>
                  <tr
                    onClick={() => onRowClick?.(row)}
                    className={`${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                    } transition-colors`}
                  >
                  {generatedColumns.filter(col => visibleColumns.includes(col.key)).map(column => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {renderCellValue(column, row)}
                    </td>
                  ))}
                  {showInsights && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rowId = (row as any).id;
                          setExpandedRowId(expandedRowId === rowId ? null : rowId);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors relative group"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            expandedRowId === (row as any).id ? 'rotate-90' : ''
                          }`}
                        />
                        {insightCounts[(row as any).id] > 0 && (
                          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-gray-700 dark:text-gray-300 transform translate-x-1/2 -translate-y-1/2 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-gray-400 dark:group-hover:bg-gray-500">
                            {insightCounts[(row as any).id]}
                          </span>
                        )}
                      </button>
                    </td>
                  )}
                  {showActions && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(row);
                            }}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {showInsights && expandedRowId === (row as any).id && expandedRowId && (
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td
                      colSpan={
                        generatedColumns.filter(col => visibleColumns.includes(col.key)).length +
                        (statusField ? 1 : 0) +
                        (showInsights ? 1 : 0) +
                        (showActions ? 1 : 0)
                      }
                      className="px-4 py-4"
                    >
                      {rowInsights[expandedRowId]?.loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading insights...</span>
                        </div>
                      ) : rowInsights[expandedRowId]?.insights?.length > 0 ? (
                        <div className="space-y-3">
                          {rowInsights[expandedRowId]?.insights.map((insight: Insight, idx: number) => (
                            <InsightCard key={idx} insight={insight} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No insights available
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
