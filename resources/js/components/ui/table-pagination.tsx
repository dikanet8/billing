import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    itemsPerPage: number;
    setItemsPerPage: (items: number) => void;
    totalItems: number;
    paginatedLength: number;
    itemName?: string;
}

export function TablePagination({
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    paginatedLength,
    itemName = 'data'
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    return (
        <div className="px-4 py-2.5 sm:p-4 border-t border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/30 dark:bg-neutral-900/20 gap-2 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span>
                    Menampilkan {paginatedLength} dari {totalItems} {itemName}
                </span>
                
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block">Tampil:</span>
                    <div className="relative">
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Reset to first page on change
                            }}
                            className="appearance-none pl-3 pr-7 relative z-0 flex h-7 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none z-10">
                            <ChevronDown className="h-3 w-3 text-neutral-400" />
                        </div>
                    </div>
                </div>
            </div>
            
            {totalPages > 1 && (
                <div className="flex gap-2 sm:gap-1.5 items-center w-full sm:w-auto justify-center sm:justify-end">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 text-xs px-3 bg-white dark:bg-neutral-950 flex-1 sm:flex-none shadow-sm"
                    >
                        Sebelumnya
                    </Button>
                    
                    {/* Desktop Page Numbers */}
                    <div className="hidden sm:flex items-center gap-1 mx-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors ${
                                            currentPage === page 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-1 text-neutral-400">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    {/* Mobile Page Indicator */}
                    <div className="flex sm:hidden items-center justify-center px-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        {currentPage} / {totalPages}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 text-xs px-3 bg-white dark:bg-neutral-950 flex-1 sm:flex-none shadow-sm"
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}
        </div>
    );
}
