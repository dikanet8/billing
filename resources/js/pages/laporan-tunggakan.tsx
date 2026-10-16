import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, AlertTriangle, Users, Receipt, Calendar, Eye, Filter, TrendingUp, TrendingDown, BarChart3, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function LaporanTunggakan({ dataTunggakan = [], filters = {} }: { dataTunggakan?: any[], filters?: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterType, setFilterType] = useState(filters.filterType || 'Lebih dari 1 Bulan'); // 'Semua', 'Lebih dari 1 Bulan'
    const [visibleMobileCount, setVisibleMobileCount] = useState(10);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleMobileCount(prev => prev + 10);
            }
        }, { threshold: 0.1 });

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget.current]);

    useEffect(() => {
        setCurrentPage(1);
        setVisibleMobileCount(10);
    }, [searchQuery, filterType, itemsPerPage]);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatBulan = (bulanStr: string) => {
        if (!bulanStr) return '';
        if (!bulanStr.includes('-')) return bulanStr;
        const [year, month] = bulanStr.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    };

    // Aggregate Data by Customer
    const { groupedData, filteredCustomerData, paginatedCustomerData } = useMemo(() => {
        const groups = dataTunggakan.reduce((acc: any, curr: any) => {
            const pId = curr.pelanggan?.id;
            if (!pId) return acc;
            
            if (!acc[pId]) {
                acc[pId] = {
                    pelanggan: curr.pelanggan,
                    jumlahBulan: 0,
                    totalTagihan: 0,
                    totalBayar: 0,
                    sisaTagihan: 0,
                    list: []
                };
            }
            acc[pId].jumlahBulan += 1;
            acc[pId].totalTagihan += Number(curr.total_tarif) || 0;
            acc[pId].totalBayar += Number(curr.total_bayar) || 0;
            acc[pId].sisaTagihan += Number(curr.sisa_tagihan) || 0;
            acc[pId].list.push(curr);
            return acc;
        }, {});

        let customerData = Object.values(groups).sort((a: any, b: any) => b.sisaTagihan - a.sisaTagihan);

        // Apply Filter Type (> 1 Bulan)
        if (filterType === 'Lebih dari 1 Bulan') {
            customerData = customerData.filter((c: any) => c.jumlahBulan > 1);
        }

        const filtered = customerData.filter((c: any) => {
            if (!searchQuery) return true;
            const nama = c.pelanggan?.nama?.toLowerCase() || '';
            const id = String(c.pelanggan?.id).toLowerCase();
            return nama.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
        });

        return {
            groupedData: customerData,
            filteredCustomerData: filtered,
            paginatedCustomerData: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        };
    }, [dataTunggakan, searchQuery, filterType, currentPage, itemsPerPage]);

    // Global KPIs
    const totalSisaTunggakan: number = groupedData.reduce((acc: number, curr: any) => acc + Number(curr.sisaTagihan), 0);
    const totalPelangganMenunggakUnik: number = groupedData.length;
    const totalLembarTagihan: number = groupedData.reduce((acc: number, curr: any) => acc + Number(curr.jumlahBulan), 0);
    const highestDebt: number = groupedData.length > 0 ? Math.max(...groupedData.map((c: any) => Number(c.sisaTagihan))) : 0;
    
    const openDetailModal = (customerData: any) => {
        setSelectedCustomerData(customerData);
        setIsModalOpen(true);
    };

    return (
        <>
            <Head title="Laporan Tunggakan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:pb-6 lg:p-6 lg:pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 sm:mb-0">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Laporan Tunggakan Pelanggan</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Rekapitulasi sisa tagihan yang dikelompokkan per pelanggan.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Sisa Tunggakan */}
                    <Card 
                        className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition duration-200"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <AlertTriangle className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Sisa Tunggakan</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{formatCurrency(totalSisaTunggakan)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg">
                                <AlertTriangle className="w-3 h-3 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2.5 rounded-sm border border-rose-500/50 bg-transparent text-rose-600 dark:text-rose-400">
                                <span>Menunggak</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Dari pelanggan yang ditampilkan</span>
                        </div>
                    </Card>
                    
                    {/* Pelanggan Menunggak */}
                    <Card 
                        className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition duration-200"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <UserMinus className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Pelanggan</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{totalPelangganMenunggakUnik} <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">Orang</span></span>
                            </div>
                            <div className="p-1 sm:p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg">
                                <UserMinus className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2.5 rounded-sm border border-amber-500/50 bg-transparent text-amber-600 dark:text-amber-400">
                                <span>Perhatian</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Total orang pada filter saat ini</span>
                        </div>
                    </Card>

                    {/* Total Lembar Tagihan */}
                    <Card 
                        className="relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition duration-200"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Receipt className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Lembar Tagihan</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{totalLembarTagihan} <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">Invoice</span></span>
                            </div>
                            <div className="p-1 sm:p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg">
                                <Receipt className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2.5 rounded-sm border border-blue-500/50 bg-transparent text-blue-600 dark:text-blue-400">
                                <span>Tagihan</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Jumlah invoice belum lunas</span>
                        </div>
                    </Card>

                    {/* Tunggakan Tertinggi */}
                    <Card 
                        className="relative overflow-hidden border border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition duration-200"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <BarChart3 className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Tunggakan Tertinggi</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{formatCurrency(highestDebt)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-purple-100/50 dark:bg-purple-900/50 rounded-lg">
                                <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2.5 rounded-sm border border-purple-500/50 bg-transparent text-purple-600 dark:text-purple-400">
                                <span>Tertinggi</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Dari satu pelanggan</span>
                        </div>
                    </Card>
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                <Users className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Rekapitulasi Per Pelanggan</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-2">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari pelanggan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-64 bg-white dark:bg-neutral-950 pl-9 h-9 border-neutral-200 dark:border-neutral-800 shadow-none transition-all focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="flex w-full sm:w-auto items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-md">
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${filterType === 'Semua' ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    onClick={() => setFilterType('Semua')}
                                >
                                    Semua
                                </button>
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${filterType === 'Lebih dari 1 Bulan' ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    onClick={() => setFilterType('Lebih dari 1 Bulan')}
                                >
                                    {'> 1 Bulan'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-[10px] sm:text-xs text-neutral-500 truncate dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Pelanggan</th>
                                    <th className="px-6 py-3.5 font-medium">Paket / Area</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Bulan Nunggak</th>
                                    <th className="px-6 py-3.5 font-medium text-right">Total Tagihan</th>
                                    <th className="px-6 py-3.5 font-medium text-right">Telah Dibayar</th>
                                    <th className="px-6 py-3.5 font-medium text-right">Sisa Tunggakan</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedCustomerData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada pelanggan yang menunggak ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedCustomerData.map((c: any) => (
                                    <tr key={c.pelanggan.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{c.pelanggan.nama}</span>
                                                <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{c.pelanggan.nomor_pelanggan || c.pelanggan.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-neutral-700 dark:text-neutral-300">{c.pelanggan.paket?.paket_nama || '-'}</span>
                                                <span className="text-[11px] text-neutral-500">{c.pelanggan.area?.nama_area || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-sm border bg-transparent text-xs ${c.jumlahBulan > 1 ? 'border-rose-500/50 text-rose-600 dark:text-rose-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'}`}>
                                                {c.jumlahBulan} Bulan
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-neutral-600 dark:text-neutral-300">
                                            {formatCurrency(c.totalTagihan)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(c.totalBayar)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(c.sisaTagihan)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => openDetailModal(c)}
                                                className="h-8 text-[11px] px-3 bg-white dark:bg-neutral-900"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Rincian Tagihan
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-4">
                        {filteredCustomerData.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data pelanggan ditemukan.
                            </div>
                        )}
                        {filteredCustomerData.slice(0, visibleMobileCount).map((c: any) => (
                            <div key={c.pelanggan.id} className="p-4 mx-3 my-2 rounded-md shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col gap-3 relative overflow-hidden transition-transform duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-md flex items-center justify-center border shrink-0 ${c.jumlahBulan > 1 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'}`}>
                                            <Users className={`w-5 h-5 ${c.jumlahBulan > 1 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span suppressHydrationWarning className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1 pb-0.5">
                                                {c.pelanggan.nama}
                                            </span>
                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{c.pelanggan.nomor_pelanggan || c.pelanggan.id}</span>
                                                <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                                                <span className="truncate">{c.pelanggan.paket?.paket_nama || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="flex flex-col p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <span className="text-[10px] text-neutral-500 mb-0.5">Bulan Nunggak</span>
                                        <span className={`text-xs font-medium ${c.jumlahBulan > 1 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{c.jumlahBulan} Bulan</span>
                                    </div>
                                    <div className="flex flex-col p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-0.5">Telah Dibayar</span>
                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(c.totalBayar)}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 mt-1">
                                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-500">Sisa Tunggakan</span>
                                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{formatCurrency(c.sisaTagihan)}</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => openDetailModal(c)}
                                    className="w-full mt-1 bg-white dark:bg-neutral-900"
                                >
                                    <Eye className="w-4 h-4 mr-2" /> Lihat Rincian Tagihan
                                </Button>
                            </div>
                        ))}
                        {filteredCustomerData.length > visibleMobileCount && (
                            <div ref={observerTarget} className="flex justify-center p-4">
                                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <TablePagination 
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={filteredCustomerData.length}
                            paginatedLength={paginatedCustomerData.length}
                            itemName="pelanggan"
                        />
                    </div>
                </Card>
            </div>

            {/* Modal Detail Tagihan Pelanggan */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" /> Rincian Tagihan Tertunggak
                        </DialogTitle>
                        <DialogDescription suppressHydrationWarning className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            Daftar bulan yang belum lunas dibayar oleh <strong className="text-neutral-700 dark:text-neutral-300">{selectedCustomerData?.pelanggan?.nama}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {selectedCustomerData?.list?.length > 0 ? (
                            <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {selectedCustomerData.list.sort((a: any, b: any) => b.bulan_tagihan.localeCompare(a.bulan_tagihan)).map((t: any) => (
                                    <div key={t.id_tagihan} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {formatBulan(t.bulan_tagihan)}
                                            </span>
                                            <span className="text-[11px] text-neutral-500 mt-0.5">Tagihan: {formatCurrency(t.total_tarif)}</span>
                                        </div>
                                        <div className="flex items-center gap-4 sm:justify-end">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-neutral-500">Sisa Tunggakan</span>
                                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(t.sisa_tagihan)}</span>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-sm border bg-transparent text-[11px] uppercase tracking-wider ${
                                                t.status_bayar === 'Belum bayar' ? 'border-rose-500/50 text-rose-600 dark:text-rose-400' :
                                                t.status_bayar === 'Isolir' ? 'border-neutral-500/50 text-neutral-600 dark:text-neutral-400' :
                                                'border-amber-500/50 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {t.status_bayar}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-neutral-500">
                                Data tagihan tidak ditemukan.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

LaporanTunggakan.layout = {
    breadcrumbs: [
        {
            title: 'Laporan Tunggakan',
            href: '/laporan-tunggakan',
        },
    ],
};
