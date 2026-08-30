# RPL Expo 2026

Aplikasi katalog, manajemen submission, dan voting People's Choice untuk RPL Expo. Dibangun dengan Next.js 16, Supabase, dan Vercel.

## Fitur

- Katalog publik 14 proyek dan halaman detail tiap booth
- Voting tanpa login: pilih proyek, isi NIS/NIP, konfirmasi
- Satu identitas hanya dapat memberikan satu suara; identitas disimpan sebagai HMAC hash
- Login peserta, buat/gabung tim, dan upload submission proyek
- Panel admin untuk review proyek, nomor booth, buka/tutup voting, dan publikasi hasil
- Poster QR katalog/voting siap cetak
- Winner reveal fullscreen dengan countdown, podium, animasi, dan confetti

## Menjalankan secara lokal

Gunakan Node.js 20.9 atau lebih baru.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Setup Supabase

1. Buat project Supabase.
2. Terapkan seluruh file di `supabase/migrations/` sesuai urutan nama file, atau jalankan `supabase db push` setelah project di-link.
3. Dari **Project Settings > API Keys**, salin publishable key dan secret key ke `.env.local`.
4. Untuk persiapan acara yang singkat, buka **Authentication > Providers > Email** lalu nonaktifkan **Confirm email** agar akun peserta langsung aktif.
5. Isi email panitia pada `ADMIN_EMAILS`. Pisahkan beberapa email dengan koma tanpa spasi.

Contoh:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
VOTER_HASH_SECRET=hasil-random-minimal-32-karakter
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=panitia@sekolah.sch.id
```

Buat rahasia voter dengan:

```bash
openssl rand -hex 32
```

Jangan pernah membagikan atau memasukkan `SUPABASE_SECRET_KEY` dan `VOTER_HASH_SECRET` ke repository.

## Deploy Vercel

1. Import repository ini ke Vercel dengan **Root Directory** `rpl24-expo` bila repository Git berada satu tingkat di atas folder ini.
2. Masukkan keenam environment variable di atas untuk environment Production.
3. Ubah `NEXT_PUBLIC_SITE_URL` menjadi domain produksi, misalnya `https://rpl-expo.vercel.app`.
4. Deploy, lalu buat akun dengan email yang tercantum di `ADMIN_EMAILS`.

Build check:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Urutan operasional acara

1. Tim membuat akun, membuat/gabung tim, lalu ketua mengirim proyek.
2. Admin membuka `/admin`, mengisi nomor booth dan meng-approve seluruh proyek.
3. Admin mencetak QR dari `/admin/qr` dan meletakkannya di pintu/area auditorium.
4. Setelah pengunjung keluar menuju booth, admin menekan **Buka voting**.
5. Setelah waktu habis, admin menekan **Tutup voting**.
6. Tampilkan `/admin/reveal` di layar utama dan tekan **Mulai pengumuman**.
7. Setelah reveal selesai, admin menekan **Publikasikan hasil** agar `/results` terbuka untuk publik.

## Catatan voting

Database memakai unique constraint dan fungsi transaksi atomik, sehingga dua request bersamaan dari identitas yang sama tidak dapat menghasilkan dua vote. NIS/NIP tidak disimpan mentah. Sistem sengaja tidak memvalidasi nomor terhadap daftar siswa agar antrean voting tetap sederhana; jika validasi resmi dibutuhkan, tambahkan whitelist identitas sebelum acara.
