import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import PasswordInput from '@/components/password-input';
import { useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';
import { Card } from '@/components/ui/card';
import { Camera, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { UserInfo } from '@/components/user-info';
import { Spinner } from '@/components/ui/spinner';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
    passwordRules,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    passwordRules?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const { auth } = usePage<PageProps>().props;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <Head title="Profil Pengguna" />

            <div className="space-y-6 max-w-2xl mx-auto pb-10">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Profil Pengguna</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola informasi pribadi dan alamat email Anda.</p>
                </div>

                <Card className="p-6 border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                {/* Avatar Upload Section */}
                                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center p-4 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                    <div className="relative group">
                                        <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center relative">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : auth.user.avatar ? (
                                                <img src={`/storage/${auth.user.avatar}`} alt={auth.user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon className="h-8 w-8 text-neutral-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1 w-full">
                                        <Label htmlFor="avatar" className="font-semibold text-neutral-900 dark:text-white">Foto Profil</Label>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Gunakan format JPG, PNG, atau GIF. Maksimal 2MB.</p>
                                        <div className="relative mt-2">
                                            <Input
                                                id="avatar"
                                                type="file"
                                                name="avatar"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Button type="button" variant="outline" className="w-full sm:w-auto text-xs bg-white dark:bg-neutral-900 pointer-events-none">
                                                <Camera className="w-4 h-4 mr-2" />
                                                Pilih Gambar Baru
                                            </Button>
                                        </div>
                                        <InputError className="mt-1" message={errors.avatar} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Lengkap</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input
                                            id="name"
                                            className="pl-9 bg-neutral-50/50 dark:bg-neutral-900 focus:bg-white dark:focus:bg-neutral-950 transition-colors"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Nama lengkap Anda"
                                        />
                                    </div>
                                    <InputError className="mt-1" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Alamat Email</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-9 bg-neutral-50/50 dark:bg-neutral-900 focus:bg-white dark:focus:bg-neutral-950 transition-colors"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Alamat email Anda"
                                        />
                                    </div>
                                    <InputError className="mt-1" message={errors.email} />
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            Alamat email Anda belum diverifikasi.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                                            >
                                                Klik di sini untuk mengirim ulang email verifikasi.
                                            </Link>
                                        </p>
                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                Tautan verifikasi baru telah dikirim ke alamat email Anda.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                    >
                                        {processing && <Spinner className="w-4 h-4 mr-2" />}
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>

                <div className="mt-8">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1">Ganti Kata Sandi</h2>
                        <p className="text-sm text-neutral-500 mb-4">Pastikan akun Anda menggunakan kata sandi yang panjang dan acak agar tetap aman.</p>
                    </div>
                    
                    <Card className="p-6 border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm mb-8">
                        <Form
                            {...SecurityController.update.form()}
                            options={{ preserveScroll: true }}
                            resetOnError={['password', 'password_confirmation']}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }
                            }}
                            className="space-y-6"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Kata Sandi Baru</Label>
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            className="mt-1 block w-full bg-neutral-50/50 dark:bg-neutral-900 focus:bg-white dark:focus:bg-neutral-950 transition-colors"
                                            autoComplete="new-password"
                                            placeholder="Masukkan kata sandi baru"
                                            passwordrules={passwordRules}
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation" className="text-neutral-700 dark:text-neutral-300">
                                            Konfirmasi Kata Sandi Baru
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            className="mt-1 block w-full bg-neutral-50/50 dark:bg-neutral-900 focus:bg-white dark:focus:bg-neutral-950 transition-colors"
                                            autoComplete="new-password"
                                            placeholder="Konfirmasi kata sandi baru"
                                            passwordrules={passwordRules}
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <div className="flex items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        <Button
                                            disabled={processing}
                                            data-test="update-password-button"
                                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                        >
                                            {processing && <Spinner className="w-4 h-4 mr-2" />}
                                            {processing ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </Card>
                    
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Butuh bantuan lainnya?</h3>
                        <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                            Jika Anda ingin menonaktifkan atau menghapus akun Anda, silakan hubungi Administrator atau layanan dukungan kami untuk bantuan lebih lanjut.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Profil',
            href: edit(),
        },
    ],
};
