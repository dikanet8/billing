import { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Filter, Edit, Trash2, User, Phone, MapPin, Map, Package, Router, CreditCard, CalendarDays, Activity, UserPlus, UserMinus, Server, ChevronDown, Eye, EyeOff, History, Wifi, Power, RefreshCw, Upload, LocateFixed, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';
import { useEcho } from '@laravel/echo-react';
import MapPickerField from '@/components/map-picker-field';
import CustomerDetailMap from '@/components/customer-detail-map';


export default function Pelanggan({ dataPelanggan, dataArea = [], dataPaket = [], dataMikrotik = [], isNewCustomersPage = false }: { dataPelanggan?: any[], dataArea?: any[], dataPaket?: any[], dataMikrotik?: any[], isNewCustomersPage?: boolean }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const customers = dataPelanggan || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [areaFilter, setAreaFilter] = useState('Semua');
    const [paketFilter, setPaketFilter] = useState('Semua');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('status');
            const area = params.get('area');
            const paket = params.get('paket');
            
            if (status) setStatusFilter(status);
            if (area) setAreaFilter(area);
            if (paket) setPaketFilter(paket);
        }
    }, []);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(20);
    const observerTarget = useRef(null);

    useEcho('Tenant.' + (auth?.user as any)?.tenant_id, 'PelangganUpdated', () => {
        router.reload({ only: ['dataPelanggan'] });
    }, [auth?.user], 'private');

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setMobileVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, []);

    const formatRupiah = (number: number) => {
        return 'Rp ' + Number(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const d = dateString.split(' ')[0].split('T')[0];
            const parts = d.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                return `${day} ${months[month]} ${year}`;
            }
        } catch (e) {}
        return dateString;
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const [d, tStr] = dateString.includes('T') ? dateString.split('T') : dateString.split(' ');
            if (d && tStr) {
                const parts = d.split('-');
                if (parts.length === 3) {
                    const year = parts[0];
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                    
                    const time = tStr.split('.')[0];
                    const timeParts = time.split(':');
                    const hours = timeParts[0];
                    const minutes = timeParts[1];
                    return `${day} ${months[month]} ${year} ${hours}.${minutes}`;
                }
            }
        } catch(e) {}
        return dateString;
    };

    const handleSelectAll = () => {};
    
    // UI states for filter menu
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('profil');
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [mikrotikProfiles, setMikrotikProfiles] = useState<string[]>([]);
    const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDetailPassword, setShowDetailPassword] = useState(false);

    const fetchMikrotikProfiles = async (mikrotikId: string | number) => {
        if (!mikrotikId) {
            setMikrotikProfiles([]);
            return;
        }
        setIsFetchingProfiles(true);
        try {
            const res = await fetch(`/mikrotik/${mikrotikId}/profiles`);
            const data = await res.json();
            if (data.success && Array.isArray(data.profiles)) {
                setMikrotikProfiles(data.profiles);
            } else {
                setMikrotikProfiles([]);
            }
        } catch (e) {
            setMikrotikProfiles([]);
        } finally {
            setIsFetchingProfiles(false);
        }
    };

    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [isPressingId, setIsPressingId] = useState<number | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressTriggered = useRef(false);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e: React.TouchEvent, id: number) => {
        if (!canManage) return;
        setIsPressingId(id);
        isLongPressTriggered.current = false;
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        pressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500); // 500ms for long press
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pressTimer.current) return;
        const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        // Cancel if moved more than 10 pixels
        if (deltaX > 10 || deltaY > 10) {
            handleTouchEnd();
        }
    };

    const handleTouchEnd = () => {
        setIsPressingId(null);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };


    const [isFabVisible, setIsFabVisible] = useState(true);

    useEffect(() => {
        let lastScrollY = 0;

        const handleScroll = (e: any) => {
            const target = e.target;
            const currentScrollY = target === document ? window.scrollY : (target as HTMLElement).scrollTop;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsFabVisible(false);
            } else {
                setIsFabVisible(true);
            }
            
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true } as any);
    }, []);

    const { data: formData, setData: setFormData, post, put, reset, clearErrors, errors, processing } = useForm({
        id_pelanggan: '',
        nama: '',
        telepon: '',
        alamat: '',
        pppoe: '',
        password: '',
        id_area: '',
        id_paket: '',
        id_mikrotik: '',
        profile_mikrotik: '',
        modem: '',
        status: 'AKTIF',
        tanggal: 1,
        tanggal_register: '',
        latitude: '',
        longitude: '',
    });

    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({
        file: null as File | null
    });

    const handleOpenImport = () => {
        resetImport();
        setIsImportOpen(true);
    };

    const handleSaveImport = (e: React.FormEvent) => {
        e.preventDefault();
        postImport('/pelanggan/import', {
            onSuccess: () => {
                toast.success('Data pelanggan berhasil diimport!');
                setIsImportOpen(false);
                resetImport();
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];
                toast.error(firstError as string || 'Gagal mengimport data pelanggan');
            }
        });
    };

    const handleOpenAdd = () => {
        setFormData({
            nama: '',
            telepon: '',
            pppoe: '',
            password: '',
            tanggal: 1,
            id_area: '',
            id_paket: '',
            id_mikrotik: '',
            profile_mikrotik: '',
            alamat: '',
            status: 'AKTIF',
            tanggal_register: new Date().toISOString().split('T')[0],
            modem: '',
            latitude: '',
            longitude: '',
        });
        clearErrors();
        setMikrotikProfiles([]);
        setCurrentStep(1);
        setIsAddOpen(true);
    };

    const handleOpenEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setFormData({
            nama: customer.nama || '',
            telepon: customer.telepon || '',
            pppoe: customer.pppoe || '',
            password: customer.password || '',
            tanggal: customer.tanggal || 1,
            id_area: customer.id_area || '',
            id_paket: customer.id_paket || '',
            id_mikrotik: customer.id_mikrotik || '',
            profile_mikrotik: '',
            alamat: customer.alamat || '',
            status: customer.status || 'AKTIF',
            tanggal_register: customer.tanggal_register ? new Date(customer.tanggal_register).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            modem: customer.modem || '',
            latitude: customer.latitude != null ? String(customer.latitude) : '',
            longitude: customer.longitude != null ? String(customer.longitude) : '',
        });
        clearErrors();
        if (customer.id_mikrotik) {
            fetchMikrotikProfiles(customer.id_mikrotik);
        } else {
            setMikrotikProfiles([]);
        }
        setCurrentStep(1);
        setIsEditOpen(true);
    };

    const detailScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDetailOpen && detailScrollRef.current) {
            detailScrollRef.current.scrollTop = 0;
        }
    }, [isDetailOpen, activeDetailTab]);

    const handleOpenDetail = (customer: any) => {
        setSelectedCustomer(customer);
        setActiveDetailTab('profil');
        setIsDetailOpen(true);
        setTimeout(() => {
            if (detailScrollRef.current) {
                detailScrollRef.current.scrollTop = 0;
            }
        }, 50);
    };

    const handleOpenDelete = (customer: any) => {
        setSelectedCustomer(customer);
        setIsDeleteOpen(true);
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleGetGPS = () => {
        if (!navigator.geolocation) {
            toast.error('Browser Anda tidak mendukung GPS/Geolocation.');
            return;
        }
        setIsGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: String(position.coords.latitude.toFixed(7)),
                    longitude: String(position.coords.longitude.toFixed(7)),
                });
                setIsGpsLoading(false);
                toast.success('Koordinat GPS berhasil didapatkan!');
            },
            (error) => {
                setIsGpsLoading(false);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error('Izin GPS ditolak. Harap aktifkan izin lokasi di browser Anda.');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    toast.error('Lokasi tidak tersedia. Pastikan GPS perangkat Anda aktif.');
                } else {
                    toast.error('Gagal mendapatkan lokasi GPS: ' + error.message);
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleSaveAdd = () => {
        post('/pelanggan', {
            onSuccess: () => {
                toast.success('Pelanggan berhasil ditambahkan!');
                reset();
                setIsAddOpen(false);
                setCurrentStep(1);
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];
                toast.error(firstError as string || 'Gagal menambahkan pelanggan');
            }
        });
    };

    const handleSaveEdit = () => {
        put(`/pelanggan/${selectedCustomer?.id}`, {
            onSuccess: () => {
                toast.success('Pelanggan berhasil diperbarui!');
                reset();
                setIsEditOpen(false);
                setCurrentStep(1);
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];
                toast.error(firstError as string || 'Gagal memperbarui pelanggan');
            }
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedCustomer) return;
        setIsDeleting(true);
        router.delete(`/pelanggan/${selectedCustomer?.id}`, {
            onSuccess: () => {
                toast.success('Pelanggan berhasil dihapus!');
                setIsDeleteOpen(false);
            },
            onError: (err) => {
                toast.error('Gagal menghapus pelanggan');
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter((c: any) => {
            const matchesSearch =
                (c?.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (String(c?.id || '')).toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.pppoe || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.telepon || '').includes(searchQuery);
            const matchesStatus = statusFilter === 'Semua' || (c.status || '').toUpperCase() === statusFilter.toUpperCase();
            const matchesArea = areaFilter === 'Semua' || String(c.id_area) === String(areaFilter) || String(c.area_id) === String(areaFilter);
            const matchesPaket = paketFilter === 'Semua' || String(c.id_paket) === String(paketFilter) || String(c.paket_id) === String(paketFilter);
            return matchesSearch && matchesStatus && matchesArea && matchesPaket;
        }).sort((a: any, b: any) => {
            const nameA = (a?.nama || '').toLowerCase();
            const nameB = (b?.nama || '').toLowerCase();
            return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
        });
    }, [customers, searchQuery, statusFilter, areaFilter, paketFilter]);

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobileVisibleCustomers = filteredCustomers.slice(0, mobileVisibleCount);

    return (
        <>
            <Head title={isNewCustomersPage ? "Pelanggan Baru (Bulan Ini)" : "Data Pelanggan"} />
            <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            {isNewCustomersPage ? "Pelanggan Baru (Bulan Ini)" : "Data Pelanggan"}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {isNewCustomersPage ? "Daftar pelanggan yang mendaftar pada bulan berjalan." : "Kelola informasi dan status layanan pelanggan Anda."}
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button onClick={handleOpenImport} variant="outline" className="shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                <Upload className="w-4 h-4 mr-2" /> Import Data
                            </Button>
                            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Pelanggan
                            </Button>
                        </div>
                    )}
                </div>
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-center gap-3 flex-1">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari ID, nama, atau kontak..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-blue-500"
                                />
                            </div>

                            <div className="hidden xl:flex items-center gap-2">
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="flex h-9 w-auto items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="AKTIF">Aktif</option>
                                    <option value="ISOLIR">Isolir</option>
                                    <option value="BERHENTI">Berhenti</option>
                                </select>
                                
                                <select 
                                    value={areaFilter} 
                                    onChange={(e) => {
                                        setAreaFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="flex h-9 w-auto max-w-[150px] items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                >
                                    <option value="Semua">Semua Area</option>
                                    {dataArea?.map((area: any) => (
                                        <option key={area.id_area || area.id} value={String(area.id_area || area.id)}>
                                            {area.nama_area}
                                        </option>
                                    ))}
                                </select>

                                <select 
                                    value={paketFilter} 
                                    onChange={(e) => {
                                        setPaketFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="flex h-9 w-auto max-w-[150px] items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                >
                                    <option value="Semua">Semua Paket</option>
                                    {dataPaket?.map((paket: any) => (
                                        <option key={paket.id_paket || paket.id} value={String(paket.id_paket || paket.id)}>
                                            {paket.paket_nama || paket.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex w-full xl:w-auto items-center gap-2">
                            <div className="xl:hidden w-full sm:w-auto">
                                <DropdownMenu modal={false} open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter
                                            {(statusFilter !== 'Semua' || areaFilter !== 'Semua' || paketFilter !== 'Semua') && (
                                                <span className="ml-2 w-2 h-2 rounded-full bg-blue-500"></span>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 border-sidebar-border/70 shadow-md p-3">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-neutral-500 uppercase">Status</Label>
                                                <select 
                                                    value={statusFilter} 
                                                    onChange={(e) => {
                                                        setStatusFilter(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                                >
                                                    <option value="Semua">Semua Status</option>
                                                    <option value="AKTIF">Aktif</option>
                                                    <option value="ISOLIR">Isolir</option>
                                                    <option value="BERHENTI">Berhenti</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-neutral-500 uppercase">Area</Label>
                                                <select 
                                                    value={areaFilter} 
                                                    onChange={(e) => {
                                                        setAreaFilter(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                                >
                                                    <option value="Semua">Semua Area</option>
                                                    {dataArea?.map((area: any) => (
                                                        <option key={area.id_area || area.id} value={String(area.id_area || area.id)}>
                                                            {area.nama_area}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-neutral-500 uppercase">Paket</Label>
                                                <select 
                                                    value={paketFilter} 
                                                    onChange={(e) => {
                                                        setPaketFilter(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                                >
                                                    <option value="Semua">Semua Paket</option>
                                                    {dataPaket?.map((paket: any) => (
                                                        <option key={paket.id_paket || paket.id} value={String(paket.id_paket || paket.id)}>
                                                            {paket.paket_nama || paket.nama}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            {(statusFilter !== 'Semua' || areaFilter !== 'Semua' || paketFilter !== 'Semua' || searchQuery !== '') && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full sm:w-auto h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                                    onClick={() => {
                                        setStatusFilter('Semua');
                                        setAreaFilter('Semua');
                                        setPaketFilter('Semua');
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reset Filter
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left hidden md:table">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium w-[25%]">Pelanggan</th>
                                    <th className="px-6 py-3.5 font-medium w-[25%]">Area / Alamat</th>
                                    <th className="px-6 py-3.5 font-medium w-[20%]">Paket Layanan</th>
                                    <th className="px-6 py-3.5 font-medium w-[15%]">Status Pelanggan</th>
                                    <th className="px-6 py-3.5 font-medium w-[10%]">Tanggal Daftar</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium w-[5%] text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data pelanggan ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedCustomers.map((pelanggan) => (
                                    <tr key={pelanggan?.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-[2px] border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {pelanggan?.nama}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 font-mono bg-transparent px-1.5 py-0.5 rounded-[2px] border border-blue-500/50">
                                                        {pelanggan?.nomor_pelanggan || pelanggan?.id}
                                                    </div>
                                                    <div className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-purple-100 dark:bg-purple-900/30 text-[9px] font-bold font-mono uppercase tracking-wider text-purple-700 dark:text-purple-400 leading-none">
                                                        {pelanggan.pppoe}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="font-semibold text-neutral-900 dark:text-white text-xs">
                                                        {pelanggan.area?.nama_area || 'Umum'}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2" title={pelanggan.alamat}>
                                                        {pelanggan.alamat || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                                    <Package className="w-4 h-4 text-blue-500" /> {pelanggan.paket?.paket_nama || '-'}
                                                </div>
                                                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-transparent px-2 py-0.5 rounded-sm border border-neutral-300 dark:border-neutral-600 w-fit">
                                                    {formatRupiah(pelanggan.paket?.paket_tarif || 0)}
                                                </div>
                                                {pelanggan.paket?.kecepatan && (
                                                    <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                                                        <Activity className="w-3 h-3 text-neutral-400" /> Speed: {pelanggan.paket.kecepatan} Mbps
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {pelanggan.status?.toUpperCase() === 'AKTIF' && (
                                                <span className="inline-flex items-center justify-center gap-1.5 font-medium px-2.5 py-1 rounded-sm text-sm bg-transparent text-emerald-600 dark:text-emerald-500 border border-emerald-500/50">
                                                    Aktif
                                                </span>
                                            )}
                                            {pelanggan.status?.toUpperCase() === 'ISOLIR' && (
                                                <span className="inline-flex items-center justify-center gap-1.5 font-medium px-2.5 py-1 rounded-sm text-sm bg-transparent text-rose-600 dark:text-rose-500 border border-rose-500/50">
                                                    Isolir
                                                </span>
                                            )}
                                            {pelanggan.status?.toUpperCase() !== 'AKTIF' && pelanggan.status?.toUpperCase() !== 'ISOLIR' && (
                                                <span className="inline-flex items-center justify-center gap-1.5 font-medium px-2.5 py-1 rounded-sm text-sm bg-transparent text-orange-600 dark:text-orange-500 border border-orange-500/50">
                                                    {pelanggan.status || 'Pending'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                            <div suppressHydrationWarning className="flex items-center gap-1.5">
                                                <History className="w-3.5 h-3.5 text-neutral-400" />
                                                {pelanggan.tanggal_register
                                                    ? formatDate(pelanggan.tanggal_register)
                                                    : '-'}
                                            </div>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 border-sidebar-border/70 shadow-md">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDetail(pelanggan); }} className="cursor-pointer">
                                                            <Eye className="w-4 h-4 mr-2 text-neutral-500" /> Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(pelanggan); }} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit Data
                                                        </DropdownMenuItem>
                                                        {pelanggan.status?.toUpperCase() === 'ISOLIR' || pelanggan.status?.toUpperCase() === 'BERHENTI' ? (
                                                            <DropdownMenuItem onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                router.post(`/pelanggan/${pelanggan.id}/aktifkan`, {}, { preserveScroll: true, onSuccess: () => toast.success('Pelanggan berhasil diaktifkan') });
                                                            }} className="cursor-pointer text-emerald-600 focus:text-emerald-600">
                                                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Aktifkan
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    router.post(`/pelanggan/${pelanggan.id}/isolir`, {}, { preserveScroll: true, onSuccess: () => toast.success('Pelanggan berhasil diisolir') });
                                                                }} className="cursor-pointer text-orange-600 focus:text-orange-600">
                                                                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" /> Isolir
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    router.post(`/pelanggan/${pelanggan.id}/berhenti`, {}, { preserveScroll: true, onSuccess: () => toast.success('Pelanggan berhasil diberhentikan') });
                                                                }} className="cursor-pointer text-rose-600 focus:text-rose-600">
                                                                    <XCircle className="w-4 h-4 mr-2 text-rose-600" /> Berhentikan
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDelete(pelanggan); }} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                            <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-3">
                        {mobileVisibleCustomers.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data pelanggan ditemukan.
                            </div>
                        )}
                        {mobileVisibleCustomers.map((pelanggan) => (
                            <div key={pelanggan?.id}
                                className={`p-4 mx-3 my-2 rounded-xl shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-all duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                onTouchStart={(e) => handleTouchStart(e, pelanggan.id)}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                                onContextMenu={(e) => { e.preventDefault(); }}
                                onClick={(e) => {
                                    if (!isLongPressTriggered.current) {
                                        handleOpenDetail(pelanggan);
                                    }
                                    setTimeout(() => {
                                        isLongPressTriggered.current = false;
                                    }, 50);
                                }}
                            >
                                {/* Header: Icon, Name, ID, Status */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                                            pelanggan.status?.toUpperCase() === 'AKTIF' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 
                                            pelanggan.status?.toUpperCase() === 'ISOLIR' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' : 
                                            'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                                        }`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 mb-0.5">
                                                {pelanggan?.nama || '-'}
                                            </span>
                                            <div className="flex flex-row flex-wrap gap-1.5 items-center mt-0.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-blue-500/50 text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-transparent">
                                                    {pelanggan?.nomor_pelanggan || pelanggan?.id}
                                                </span>
                                                {pelanggan?.pppoe && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-purple-100 dark:bg-purple-900/30 text-[9px] font-bold font-mono uppercase tracking-wider text-purple-700 dark:text-purple-400 leading-none">
                                                        {pelanggan.pppoe}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border bg-transparent text-xs font-bold uppercase tracking-wider ${
                                            pelanggan.status?.toUpperCase() === 'AKTIF' ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 
                                            pelanggan.status?.toUpperCase() === 'ISOLIR' ? 'border-rose-500/50 text-rose-600 dark:text-rose-400' : 
                                            'border-amber-500/50 text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {pelanggan.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Paket & Harga */}
                                    <div className="flex flex-col p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Package className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] text-neutral-500">Layanan & Tarif</span>
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                                            {pelanggan.paket?.paket_nama || 'Layanan'}
                                        </span>
                                        <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                                            {formatRupiah(pelanggan.paket?.paket_tarif || 0)}
                                        </span>
                                    </div>

                                    {/* Area & Kontak */}
                                    <div className="flex flex-col p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] text-neutral-500">Area & Kontak</span>
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                                            {pelanggan?.area?.nama_area || 'Umum'}
                                        </span>
                                        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mt-0.5">
                                            {pelanggan?.telepon || '-'}
                                        </span>
                                    </div>

                                    {/* Alamat (Full Width) */}
                                    <div className="col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <Map className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                                        <span className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                                            {pelanggan?.alamat || 'Alamat tidak tersedia'}
                                        </span>
                                    </div>
                                    

                                </div>
                            </div>
                        ))}
                        
                        <div ref={observerTarget} className="h-10 mt-4 md:hidden flex justify-center items-center">
                            {mobileVisibleCustomers.length < filteredCustomers.length && (
                                <Spinner className="w-5 h-5 text-neutral-400" />
                            )}
                        </div>
                    </div>

                    {/* Action Menu Bottom Modal (No Animation) */}
                    {actionMenuOpenId !== null && (
                        (() => {
                            const pelanggan = customers.find((p: any) => p.id === actionMenuOpenId);
                            if (!pelanggan) return null;
                            return (
                                <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
                                    <div
                                        className="absolute inset-0 bg-black/60"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                        onTouchStart={(e) => { e.stopPropagation(); }}
                                    />
                                    <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 ring-1 ring-black/5">
                                        <div className="flex justify-center p-4">
                                            <div className="w-16 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                                        </div>
                                        <div className="px-5 pb-4 pt-1">
                                            <div className="flex items-center gap-3 mb-6 px-1">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-inner">
                                                    {pelanggan?.nama?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">Menu Pelanggan</h3>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{pelanggan?.nama || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start h-12 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-semibold text-base transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenEdit(pelanggan); }}
                                                        >
                                                            <Edit className="w-5 h-5 mr-3" /> Edit Data
                                                        </Button>
                                                        {pelanggan.status?.toUpperCase() === 'ISOLIR' || pelanggan.status?.toUpperCase() === 'BERHENTI' ? (
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start h-12 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl font-semibold text-base transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActionMenuOpenId(null);
                                                                    router.post(`/pelanggan/${pelanggan.id}/aktifkan`, {}, {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => toast.success('Pelanggan berhasil diaktifkan.'),
                                                                        onError: () => toast.error('Gagal mengaktifkan pelanggan.')
                                                                    });
                                                                }}
                                                            >
                                                                <CheckCircle2 className="w-5 h-5 mr-3" /> Aktifkan Pelanggan
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start h-12 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl font-semibold text-base transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActionMenuOpenId(null);
                                                                        router.post(`/pelanggan/${pelanggan.id}/isolir`, {}, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => toast.success('Pelanggan berhasil diisolir.'),
                                                                            onError: () => toast.error('Gagal mengisolir pelanggan.')
                                                                        });
                                                                    }}
                                                                >
                                                                    <AlertTriangle className="w-5 h-5 mr-3" /> Isolir Pelanggan
                                                                </Button>
                                                                
                                                                <Button 
                                                                    variant="ghost"
                                                                    className="w-full justify-start h-12 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl font-semibold text-base transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActionMenuOpenId(null);
                                                                        router.post(`/pelanggan/${pelanggan.id}/berhenti`, {}, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => toast.success('Pelanggan berhasil diberhentikan.'),
                                                                            onError: () => toast.error('Gagal memberhentikan pelanggan.')
                                                                        });
                                                                    }}
                                                                >
                                                                    <XCircle className="w-5 h-5 mr-3" /> Berhentikan
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-semibold text-base transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenDelete(pelanggan); }}
                                                        >
                                                            <Trash2 className="w-5 h-5 mr-3" /> Hapus Data
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    <div className="hidden md:block">
                        <TablePagination
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={filteredCustomers.length}
                            paginatedLength={paginatedCustomers.length}
                            itemName="pelanggan"
                        />
                    </div>
                </Card>
            </div>

            {/* Import Data Modal */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-md border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl">
                    <form onSubmit={handleSaveImport} className="flex flex-col h-full">
                        <DialogHeader className="relative px-4 py-3 sm:px-6 sm:py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-left">
                                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                            Import Data Pelanggan
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Pilih file CSV atau Excel untuk mengimport data pelanggan.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>
                        
                        <div className="flex flex-col px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto gap-6 sm:gap-8">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="file" className="text-neutral-700 dark:text-neutral-300">File Data (.csv, .xlsx)</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        onChange={(e) => setImportData('file', e.target.files?.[0] || null)}
                                        className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                    />
                                    {importErrors.file && (
                                        <p className="text-sm text-red-500 mt-1">{importErrors.file}</p>
                                    )}
                                </div>
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-700 dark:text-blue-400 flex flex-col gap-2">
                                    <p className="font-semibold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Informasi Format File
                                    </p>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                        Pastikan kolom-kolom pada file sesuai dengan format template yang disediakan.
                                    </p>
                                    <a href="/pelanggan/export-template" className="text-xs font-medium underline mt-1 w-fit hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                        Download Template Format
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 gap-2 sm:gap-0 mt-auto">
                            <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} disabled={importProcessing} className="bg-white dark:bg-neutral-900">
                                Batal
                            </Button>
                            <Button type="submit" disabled={!importData.file || importProcessing} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                {importProcessing ? (
                                    <>
                                        <Spinner className="w-4 h-4 mr-2" /> Mengimport...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" /> Import Sekarang
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add / Edit Modal */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="flex flex-col w-[95vw] max-h-[90vh] sm:max-w-2xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl">
                    <DialogHeader className="relative px-4 py-3 sm:px-6 sm:py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                    {isEditOpen ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col gap-0.5 text-left">
                                    <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        {isEditOpen ? 'Edit Data Pelanggan' : 'Pendaftaran Pelanggan Baru'}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Langkah {currentStep} dari 3
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Stepper Progress */}
                            <div className="w-full mt-2">
                                <div className="relative flex items-start justify-between w-full">
                                    {/* Track Garis Penghubung antar Bullet */}
                                    <div
                                        style={{ left: '16.667%', right: '16.667%' }}
                                        className="absolute top-3.5 sm:top-4 -translate-y-1/2 flex items-center pointer-events-none z-0"
                                    >
                                        {/* Line 1 (Step 1 ke Step 2) */}
                                        <div className="flex-1 h-0.5 bg-neutral-200 dark:bg-neutral-800 relative">
                                            <div
                                                className={`absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ${
                                                    currentStep >= 2 ? 'w-full' : 'w-0'
                                                }`}
                                            />
                                        </div>
                                        {/* Line 2 (Step 2 ke Step 3) */}
                                        <div className="flex-1 h-0.5 bg-neutral-200 dark:bg-neutral-800 relative">
                                            <div
                                                className={`absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ${
                                                    currentStep >= 3 ? 'w-full' : 'w-0'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Step 1 */}
                                    <div
                                        onClick={() => setCurrentStep(1)}
                                        className="relative z-10 flex flex-col items-center flex-1 cursor-pointer group px-1"
                                    >
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                                                currentStep >= 1
                                                    ? 'bg-white dark:bg-neutral-950 border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-400'
                                            }`}
                                        >
                                            1
                                        </div>
                                        <span
                                            className={`text-[10px] sm:text-xs text-center leading-tight mt-1.5 transition-colors ${
                                                currentStep >= 1
                                                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                                    : 'text-neutral-500 dark:text-neutral-400 font-medium'
                                            }`}
                                        >
                                            Info Personal
                                        </span>
                                    </div>

                                    {/* Step 2 */}
                                    <div
                                        onClick={() => setCurrentStep(2)}
                                        className="relative z-10 flex flex-col items-center flex-1 cursor-pointer group px-1"
                                    >
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                                                currentStep >= 2
                                                    ? 'bg-white dark:bg-neutral-950 border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-400'
                                            }`}
                                        >
                                            2
                                        </div>
                                        <span
                                            className={`text-[10px] sm:text-xs text-center leading-tight mt-1.5 transition-colors ${
                                                currentStep >= 2
                                                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                                    : 'text-neutral-500 dark:text-neutral-400 font-medium'
                                            }`}
                                        >
                                            Layanan & Mikrotik
                                        </span>
                                    </div>

                                    {/* Step 3 */}
                                    <div
                                        onClick={() => setCurrentStep(3)}
                                        className="relative z-10 flex flex-col items-center flex-1 cursor-pointer group px-1"
                                    >
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                                                currentStep >= 3
                                                    ? 'bg-white dark:bg-neutral-950 border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-400'
                                            }`}
                                        >
                                            3
                                        </div>
                                        <span
                                            className={`text-[10px] sm:text-xs text-center leading-tight mt-1.5 transition-colors ${
                                                currentStep >= 3
                                                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                                    : 'text-neutral-500 dark:text-neutral-400 font-medium'
                                            }`}
                                        >
                                            Tagihan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto gap-6 sm:gap-8">
                        {/* Section: Personal Info (Step 1) */}
                        {currentStep === 1 && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between border-b border-sidebar-border/70 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white">Informasi Personal</h3>
                                    </div>
                                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                                        Langkah 1 dari 3
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Lengkap <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input id="name" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Cth: Budi Santoso" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                        </div>
                                        {errors.nama && <span className="text-red-500 text-xs mt-1">{errors.nama}</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="phone" className="text-neutral-700 dark:text-neutral-300">Nomor Telepon / WhatsApp <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input id="phone" value={formData.telepon} onChange={e => setFormData({ ...formData, telepon: e.target.value })} placeholder="Cth: 08123456789" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                        </div>
                                        {errors.telepon && <span className="text-red-500 text-xs mt-1">{errors.telepon}</span>}
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="address" className="text-neutral-700 dark:text-neutral-300">Alamat Pemasangan <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPin className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input id="address" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} placeholder="Cth: Jl. Merdeka No. 45" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                        </div>
                                        {errors.alamat && <span className="text-red-500 text-xs mt-1">{errors.alamat}</span>}
                                    </div>
                                    {/* GPS Coordinates + Interactive Map */}
                                    <MapPickerField
                                        latitude={formData.latitude}
                                        longitude={formData.longitude}
                                        isGpsLoading={isGpsLoading}
                                        onGetGPS={handleGetGPS}
                                        onChangeLatLng={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                        errorLatitude={errors.latitude}
                                        errorLongitude={errors.longitude}
                                    />
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="area" className="text-neutral-700 dark:text-neutral-300">Area Wilayah (Cluster) <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <Map className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <select id="area" value={formData.id_area} onChange={e => setFormData({ ...formData, id_area: e.target.value })} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                                                <option value="" className="dark:bg-neutral-900">Pilih Area</option>
                                                {dataArea.map((a: any) => (
                                                    <option key={a.id_area} value={a.id_area} className="dark:bg-neutral-900">{a.nama_area}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Layanan & Teknis (Step 2) */}
                        {currentStep === 2 && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between border-b border-sidebar-border/70 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Router className="w-4 h-4 text-blue-500" />
                                        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white">Layanan & Teknis Mikrotik</h3>
                                    </div>
                                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                                        Langkah 2 dari 3
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Pemilihan Mikrotik */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="mikrotik" className="text-neutral-700 dark:text-neutral-300">Node / Mikrotik <span className="text-red-500">*</span></Label>
                                            {isFetchingProfiles && (
                                                <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <Spinner className="w-3 h-3" /> Memuat profile...
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <Router className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <select
                                                id="mikrotik"
                                                value={formData.id_mikrotik}
                                                onChange={e => {
                                                    const newMikrotikId = e.target.value;
                                                    setFormData({ ...formData, id_mikrotik: newMikrotikId, profile_mikrotik: '' });
                                                    fetchMikrotikProfiles(newMikrotikId);
                                                }}
                                                className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            >
                                                <option value="" className="dark:bg-neutral-900">Pilih Mikrotik</option>
                                                {dataMikrotik?.map((m: any) => (
                                                    <option key={m?.id} value={m?.id} className="dark:bg-neutral-900">{m?.nama} ({m?.ip})</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        </div>
                                        {errors.id_mikrotik && <span className="text-red-500 text-xs mt-1">{errors.id_mikrotik}</span>}
                                    </div>

                                    {/* Profile PPPoE Mikrotik (Terpisah, Hanya Dikirim ke Mikrotik & Tidak Disimpan di DB) */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="profile_mikrotik" className="text-neutral-700 dark:text-neutral-300">
                                                Profile Mikrotik (PPPoE)
                                            </Label>
                                            {formData.id_mikrotik && (
                                                <button
                                                    type="button"
                                                    disabled={isFetchingProfiles}
                                                    onClick={() => fetchMikrotikProfiles(formData.id_mikrotik)}
                                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400"
                                                    title="Refresh profile dari Mikrotik"
                                                >
                                                    <RefreshCw className={`w-2.5 h-2.5 ${isFetchingProfiles ? 'animate-spin' : ''}`} /> Sinkron Profile
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <Activity className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <select
                                                id="profile_mikrotik"
                                                value={formData.profile_mikrotik}
                                                onChange={e => setFormData({ ...formData, profile_mikrotik: e.target.value })}
                                                disabled={!formData.id_mikrotik}
                                                className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="" className="dark:bg-neutral-900">
                                                    {!formData.id_mikrotik
                                                        ? 'Pilih Mikrotik terlebih dahulu'
                                                        : mikrotikProfiles.length === 0
                                                            ? (isFetchingProfiles ? 'Memuat profile...' : 'Gunakan default / nama paket')
                                                            : '-- Pilih Profile Mikrotik --'}
                                                </option>
                                                {mikrotikProfiles.map((prof: string) => (
                                                    <option key={prof} value={prof} className="dark:bg-neutral-900">
                                                        {prof}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                            Langsung diset ke Secret Mikrotik (tidak disimpan di database billing).
                                        </span>
                                    </div>

                                    {/* Pemilihan Paket Billing */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="paket" className="text-neutral-700 dark:text-neutral-300">Paket Langganan (Billing) <span className="text-red-500">*</span></Label>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <Package className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <select id="paket" value={formData.id_paket} onChange={e => setFormData({ ...formData, id_paket: e.target.value })} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                                <option value="" className="dark:bg-neutral-900">Pilih Paket Billing</option>
                                                {dataPaket.map((p: any) => (
                                                    <option key={p.id_paket} value={p.id_paket} className="dark:bg-neutral-900">
                                                        {p.paket_nama} ({formatRupiah(p.paket_tarif)})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        </div>
                                        {errors.id_paket && <span className="text-red-500 text-xs mt-1">{errors.id_paket}</span>}
                                    </div>

                                    {/* Akun PPPoE */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="pppoe" className="text-neutral-700 dark:text-neutral-300">Akun PPPoE (Username) <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Wifi className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input id="pppoe" value={formData.pppoe} onChange={e => setFormData({ ...formData, pppoe: e.target.value })} placeholder="Cth: budi_net" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                        </div>
                                        {errors.pppoe && <span className="text-red-500 text-xs mt-1">{errors.pppoe}</span>}
                                    </div>

                                    {/* Password PPPoE */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Password PPPoE</Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Kosongkan jika sama dg akun"
                                                className="pl-9 pr-10 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-neutral-400">Otomatis sinkron ke Secret Mikrotik</span>
                                        {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
                                    </div>

                                    {/* ODP / Perangkat Modem */}
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="modem" className="text-neutral-700 dark:text-neutral-300">ODP / Port / Perangkat Modem (Opsional)</Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Server className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input id="modem" value={formData.modem} onChange={e => setFormData({ ...formData, modem: e.target.value })} placeholder="Cth: ODP-PST-01 Port 3 / ZTE F609" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                        </div>
                                        {errors.modem && <span className="text-red-500 text-xs mt-1">{errors.modem}</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Administrasi & Tagihan (Step 3) */}
                        {currentStep === 3 && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between border-b border-sidebar-border/70 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-500" />
                                        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white">Administrasi & Tagihan</h3>
                                    </div>
                                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                                        Langkah 3 dari 3
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="status" className="text-neutral-700 dark:text-neutral-300">Status Layanan <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <Activity className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <select id="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                                <option value="AKTIF" className="dark:bg-neutral-900">Aktif - Berlangganan</option>
                                                <option value="ISOLIR" className="dark:bg-neutral-900">Isolir - Telat Bayar</option>
                                                <option value="BERHENTI" className="dark:bg-neutral-900">Berhenti - Non Aktif</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="date" className="text-neutral-700 dark:text-neutral-300">Tanggal Pendaftaran & Pemasangan <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <CalendarDays className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <Input type="date" id="date" value={formData.tanggal_register} onChange={e => setFormData({ ...formData, tanggal_register: e.target.value })} className="pl-9 w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 relative z-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                        </div>
                                        <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-blue-500" /> Tanggal Jatuh Tempo tagihan bulanan akan otomatis mengikuti tanggal pendaftaran ini.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col sm:flex-col w-full gap-2.5">
                        {/* Button Atas: Selanjutnya di Step 1 & 2, Simpan di Step 3 */}
                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-xs sm:text-sm font-semibold shadow-sm"
                            >
                                Selanjutnya
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={isEditOpen ? handleSaveEdit : handleSaveAdd}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-xs sm:text-sm font-semibold shadow-sm"
                            >
                                {processing && <Spinner className="w-3.5 h-3.5 mr-2" />}
                                {processing ? 'Memproses...' : 'Simpan'}
                            </Button>
                        )}

                        {/* Button Bawah: Batal */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                            className="w-full bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 h-10 text-xs sm:text-sm font-semibold"
                        >
                            Batal
                        </Button>

                        {/* Link Kembali jika bukan di Step 1 */}
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors pt-0.5 text-center w-full"
                            >
                                &larr; Kembali ke Step Sebelumnya
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-sm rounded-xl border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Pelanggan
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus pelanggan <strong>{selectedCustomer?.name}</strong>? Tindakan ini tidak dapat dibatalkan dan semua data terkait pelanggan ini akan terhapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="flex flex-col w-[95vw] max-h-[92vh] sm:max-w-4xl lg:max-w-5xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl">
                    <DialogHeader className="relative px-4 py-3 sm:px-6 sm:py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col gap-0.5 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                                            {selectedCustomer?.nama || 'Detail Pelanggan'}
                                        </DialogTitle>
                                        {selectedCustomer && (
                                            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                                                {selectedCustomer?.nomor_pelanggan || ('ID #' + selectedCustomer?.id)}
                                            </span>
                                        )}
                                    </div>
                                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Informasi profil, langganan internet, riwayat pembayaran, dan lokasi pelanggan.
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                            {/* Tab Navigation */}
                            <div className="flex px-4 sm:px-6 border-b border-sidebar-border/70 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none bg-neutral-50/30 dark:bg-neutral-900/10">
                                <button
                                    onClick={() => setActiveDetailTab('profil')}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'profil'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                >
                                    <User className="w-4 h-4" /> Profil & Lokasi
                                </button>
                                <button
                                    onClick={() => setActiveDetailTab('pembayaran')}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'pembayaran'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                >
                                    <History className="w-4 h-4" /> Riwayat Pembayaran
                                </button>
                                <button
                                    onClick={() => setActiveDetailTab('teknis')}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'teknis'
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                >
                                    <Activity className="w-4 h-4" /> Detail Teknis & CPE
                                </button>
                            </div>

                            <div ref={detailScrollRef} className="px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto">
                                {activeDetailTab === 'profil' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                        {/* Info Profil & Kontak */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Profil & Kontak</h4>
                                            </div>
                                            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
                                                <div className="flex flex-col">
                                                    <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Nama Lengkap</div>
                                                    <div className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{selectedCustomer.nama}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">ID / No. Pelanggan</div>
                                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md w-fit border border-blue-200 dark:border-blue-800">
                                                            {selectedCustomer?.nomor_pelanggan || selectedCustomer?.id}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Telepon / WhatsApp</div>
                                                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{selectedCustomer.telepon || '-'}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Area Wilayah</div>
                                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{selectedCustomer.area?.nama_area || '-'}</div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Alamat Pemasangan</div>
                                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedCustomer.alamat || '-'}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50">
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Jatuh Tempo</div>
                                                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedCustomer.tanggal ? `Setiap Tgl ${selectedCustomer.tanggal}` : '-'}</div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Tanggal Registrasi</div>
                                                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedCustomer.tanggal_register ? formatDate(selectedCustomer.tanggal_register) : '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Layanan & Teknis + Peta */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-4 h-4 text-emerald-500" />
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Layanan Internet & Jaringan</h4>
                                            </div>
                                            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Paket Internet</div>
                                                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                            {selectedCustomer.paket?.paket_nama || '-'}
                                                            {selectedCustomer.paket?.paket_tarif ? (
                                                                <span className="block text-xs font-normal text-neutral-500">{formatRupiah(selectedCustomer.paket.paket_tarif)}/bln</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Status Layanan</div>
                                                        <div className="mt-0.5">
                                                            {selectedCustomer.status?.toUpperCase() === 'AKTIF' ? (
                                                                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                    Aktif
                                                                </span>
                                                            ) : selectedCustomer.status?.toUpperCase() === 'ISOLIR' ? (
                                                                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                                                    Isolir
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-xs bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                                                                    {selectedCustomer.status || 'Berhenti'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-1">
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Akun PPPoE</div>
                                                        <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedCustomer.pppoe || '-'}</div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Password PPPoE</div>
                                                        <div className="font-mono text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                            <span>{showDetailPassword ? (selectedCustomer.password || selectedCustomer.pppoe || '-') : '••••••••'}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowDetailPassword(!showDetailPassword)}
                                                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-0.5 rounded"
                                                                title={showDetailPassword ? 'Sembunyikan password' : 'Lihat password'}
                                                            >
                                                                {showDetailPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-1">
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Router Mikrotik</div>
                                                        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                            {dataMikrotik?.find((m: any) => m.id === selectedCustomer.id_mikrotik)?.nama || (selectedCustomer.id_mikrotik ? `Mikrotik #${selectedCustomer.id_mikrotik}` : '-')}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">Modem (ONT/CPE)</div>
                                                        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{selectedCustomer.modem || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Peta Lokasi Pelanggan (Tepat di bawah Informasi Layanan Dasar) */}
                                            <div className="pt-1">
                                                <CustomerDetailMap
                                                    latitude={selectedCustomer.latitude}
                                                    longitude={selectedCustomer.longitude}
                                                    customerName={selectedCustomer.nama}
                                                    address={selectedCustomer.alamat}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeDetailTab === 'pembayaran' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Riwayat 5 Tagihan Terakhir</h4>
                                        </div>
                                        {(!selectedCustomer.tagihan || selectedCustomer.tagihan.length === 0) ? (
                                            <div className="text-center py-8 text-neutral-500 text-sm border border-dashed border-sidebar-border/70 rounded-lg">
                                                Belum ada riwayat tagihan atau pembayaran.
                                            </div>
                                        ) : (
                                            <div className="border border-sidebar-border/70 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left hidden md:table">
                                                    <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-500 border-b border-sidebar-border/70">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Bulan Tagihan</th>
                                                            <th className="px-4 py-2 font-medium">Total Tarif</th>
                                                            <th className="px-4 py-2 font-medium">Status</th>
                                                            <th className="px-4 py-2 font-medium">Tanggal Bayar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-sidebar-border/70">
                                                        {selectedCustomer.tagihan.map((tagihan: any) => (
                                                            <tr key={tagihan.id_tagihan} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/20">
                                                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{tagihan.bulan_tagihan}</td>
                                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatRupiah(tagihan.total_tarif || 0)}</td>
                                                                <td className="px-4 py-3">
                                                                    {tagihan.status_bayar?.toLowerCase() === 'lunas' ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-sm dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Lunas</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded-sm dark:bg-orange-900/20 dark:text-orange-400"><AlertCircle className="w-3 h-3" /> Belum Bayar</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                                    {tagihan.pembayaran?.tgl_bayar ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{formatDateTime(tagihan.pembayaran.tgl_bayar)}</span>
                                                                            <span className="text-[10px] text-neutral-400 mt-0.5">Oleh: {tagihan.pembayaran.user?.name || 'Sistem'}</span>
                                                                        </div>
                                                                    ) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {/* Mobile Cards */}
                                                <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70">
                                                    {selectedCustomer.tagihan.map((tagihan: any) => (
                                                        <div key={tagihan.id_tagihan} className="p-3 flex flex-col gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/20">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-semibold text-sm text-neutral-900 dark:text-white">{tagihan.bulan_tagihan}</span>
                                                                {tagihan.status_bayar?.toLowerCase() === 'lunas' ? (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-sm dark:bg-emerald-900/20 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Lunas</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded-sm dark:bg-orange-900/20 dark:text-orange-400"><AlertCircle className="w-3 h-3" /> Belum Bayar</span>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs text-neutral-500">
                                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatRupiah(tagihan.total_tarif || 0)}</span>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="flex items-center gap-1 text-[10px]"><CalendarDays className="w-3 h-3" /> {tagihan.pembayaran?.tgl_bayar ? formatDateTime(tagihan.pembayaran.tgl_bayar) : '-'}</span>
                                                                    {tagihan.pembayaran?.tgl_bayar && <span className="text-[9px] text-neutral-400 mt-0.5">Oleh: {tagihan.pembayaran.user?.name || 'Sistem'}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeDetailTab === 'teknis' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-sidebar-border/70 pb-3">
                                            <div>
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">GenieACS Monitor (Dummy)</h4>
                                                <p className="text-xs text-neutral-500 mt-1">Data berikut adalah placeholder dan siap dihubungkan ke API GenieACS.</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                                <RefreshCw className="w-3 h-3" /> Refresh Data
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Status PPPoE */}
                                            <div className="p-4 border border-sidebar-border/70 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/20">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-3">
                                                    <Router className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-medium">Koneksi PPPoE</span>
                                                </div>
                                                <div className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedCustomer.pppoe || 'N/A'}</div>
                                                <div className="text-xs text-emerald-600 font-medium mt-1">● Online (Uptime: 4d 2h)</div>
                                            </div>

                                            {/* IP Address */}
                                            <div className="p-4 border border-sidebar-border/70 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/20">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-3">
                                                    <Server className="w-4 h-4 text-purple-500" />
                                                    <span className="text-xs font-medium">IP Address (WAN)</span>
                                                </div>
                                                <div className="text-lg font-semibold text-neutral-900 dark:text-white">10.10.50.211</div>
                                                <div className="text-xs text-neutral-500 mt-1">Dinamic IP (Pool A)</div>
                                            </div>

                                            {/* Sinyal Optik */}
                                            <div className="p-4 border border-sidebar-border/70 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/20">
                                                <div className="flex items-center gap-2 text-neutral-500 mb-3">
                                                    <Wifi className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs font-medium">Rx Optical Power</span>
                                                </div>
                                                <div className="text-lg font-semibold text-neutral-900 dark:text-white">-21.50 dBm</div>
                                                <div className="text-xs text-emerald-600 font-medium mt-1">Kualitas Sinyal Normal</div>
                                            </div>
                                        </div>

                                        <div className="p-4 border border-sidebar-border/70 rounded-xl bg-white dark:bg-neutral-950">
                                            <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Detail Perangkat CPE</h5>
                                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                                <div>
                                                    <span className="text-neutral-500 text-xs block">Model Modem</span>
                                                    <span className="font-medium">{selectedCustomer.modem || 'ZTE F609'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-neutral-500 text-xs block">MAC Address</span>
                                                    <span className="font-medium font-mono text-xs">E0:B9:E5:XX:XX:XX</span>
                                                </div>
                                                <div>
                                                    <span className="text-neutral-500 text-xs block">Firmware Version</span>
                                                    <span className="font-medium text-xs">V5.3.10P1T1</span>
                                                </div>
                                                <div>
                                                    <span className="text-neutral-500 text-xs block">WLAN SSID</span>
                                                    <span className="font-medium">WIFI_RUMAHKU</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="w-full sm:w-auto h-9 text-xs bg-white dark:bg-neutral-950">
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManage && (
                <Button
                    onClick={(e) => { e.currentTarget.blur(); handleOpenAdd(); }}
                    className={`md:hidden fixed right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 p-0 ${isFabVisible ? 'bottom-20 scale-100' : '-bottom-20 scale-0'}`}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

Pelanggan.layout = {
    breadcrumbs: [
        {
            title: 'Data Pelanggan',
            href: '/pelanggan',
        },
    ],
};
