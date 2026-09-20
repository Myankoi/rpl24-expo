# RPL Expo

Aplikasi katalog, submission tim, event archive, dan People's Choice Voting untuk RPL Expo SMKN 24 Jakarta. Satu instalasi dapat menyimpan banyak edisi tahunan; hanya satu edisi yang aktif pada satu waktu.

## Fitur utama

- Event-scoped catalog dengan arsip permanen di `/editions/[slug]`.
- Tim dan submission yang dapat dipakai ulang oleh akun yang sama pada edisi berbeda.
- Kategori dan kode booth fleksibel per edisi; tidak ada batas 14 proyek/booth di aplikasi.
- Review organizer dengan status `submitted`, `changes_requested`, `approved`, dan `rejected`.
- Voting berbasis tiket pengunjung sekali pakai, bukan fingerprint perangkat.
- Generator batch tiket QR dari `/admin/qr`; token mentah hanya ditampilkan sekali.
- Snapshot hasil dengan ranking seri/juara bersama, audit log, metadata dinamis, sitemap, dan robots.
- Operasional tahunan dari `/admin/events`: buat draft edisi, atur kode enrollment, dan aktifkan edisi berikutnya tanpa mengubah kode aplikasi.

## Menjalankan lokal

Gunakan Node.js 22 atau lebih baru.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Buka `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
VOTER_HASH_SECRET=legacy-secret-minimal-32-karakter
VOTING_TICKET_SECRET=secret-acak-minimal-32-karakter
ENROLLMENT_CODE_SECRET=secret-acak-minimal-32-karakter
EVENT_ENROLLMENT_CODE=kode-enrollment-edisi-aktif
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=panitia@sekolah.sch.id
```

`VOTING_TICKET_SECRET` dan `ENROLLMENT_CODE_SECRET` harus stabil setelah event berjalan. Isi `EVENT_ENROLLMENT_CODE` hanya sebagai fallback untuk event legacy yang belum memiliki hash di database. Jangan masukkan secret ke repository.

## Supabase migration

Terapkan migration secara berurutan pada project Supabase yang sama dengan `NEXT_PUBLIC_SUPABASE_URL`. Migration `20260920120000_multi_event_foundation.sql` harus dijalankan setelah schema awal; migration ini membuat event legacy `rpl-expo-2026`, melakukan backfill `event_id`, mengganti uniqueness menjadi per-event, dan mempertahankan kolom compatibility untuk satu release. Jangan menjalankan migration ini ulang pada database yang sudah berhasil menerapkannya.

Pada database produksi:

1. Backup database dan inventaris storage.
2. Aktifkan maintenance/read-only mutation singkat.
3. Terapkan migration dan verifikasi jumlah event, tim, proyek, vote, dan asset.
4. Deploy aplikasi baru.
5. Jalankan smoke test katalog, login, dashboard, admin, penerbitan tiket, voting, dan hasil.
6. Buka kembali mutation setelah semua verifikasi lulus.

Untuk setup melalui Supabase Dashboard, buka **SQL Editor**, jalankan seluruh file migration, lalu verifikasi tabel utama:

```sql
select to_regclass('public.events') as events_table;
select count(*) as event_count from public.events;
```

`events_table` harus bernilai `public.events` dan minimal satu event aktif harus tersedia sebelum aplikasi baru dijalankan.

## Alur event

Organizer memindahkan event dari panel admin melalui fase:

`draft → registration → review → showcase → voting → closed → published → archived`

Peserta mendaftar dengan kode enrollment, memverifikasi email, membuat/gabung tim, lalu mengirim proyek. Organizer menetapkan kategori, booth, review, batch tiket, status voting, dan publikasi hasil.

Edisi yang sudah `published` atau `archived` tetap tersedia di `/editions` dan tidak memakai data edisi aktif. Pergantian edisi sebaiknya dilakukan saat maintenance window singkat agar tidak ada pendaftaran atau voting yang masuk di tengah pergantian.

## Pemeriksaan lokal

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Untuk production, jalankan Next.js 16 dengan Node 22 dan pertahankan `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stabil di seluruh instance.

## Troubleshooting schema

Jika log menampilkan `PGRST205` dan menyebut tabel `public.events` tidak ditemukan, aplikasi baru sudah ter-deploy tetapi database masih memakai schema lama. Pastikan URL project pada `.env` benar, lalu jalankan seluruh migration multi-edition dari Supabase Dashboard → SQL Editor, terutama [`20260920120000_multi_event_foundation.sql`](supabase/migrations/20260920120000_multi_event_foundation.sql). Setelah migration berhasil dan query verifikasi di atas menunjukkan `public.events`, restart dev server.

Jika tabel sudah ada tetapi PostgREST masih tidak mengenalinya, jalankan di SQL Editor lalu coba lagi:

```sql
NOTIFY pgrst, 'reload schema';
```

Jika migration berhenti karena error SQL, hentikan deployment aplikasi baru dan selesaikan error migration terlebih dahulu; jangan menghapus tabel atau mengulang script secara manual tanpa memeriksa migration yang sudah berhasil diterapkan.
