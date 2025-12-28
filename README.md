# Personal Fitness Tracker (FitTrack)

Website pelacak kebugaran pribadi dengan fitur AI Coach, Jurnal Latihan, dan Galeri Progress. Dibuat khusus untuk pemula yang ingin membangun otot.

## Fitur Utama
1.  **Dashboard**: Ringkasan aktivitas mingguan.
2.  **Jurnal Latihan (Workout Log)**: Catat latihan, beban, set, dan reps. Bisa melihat riwayat untuk membandingkan progress.
3.  **AI Coach**: Konsultasi fitness dan nutrisi.
    *   Konversi makanan ke kalori.
    *   Konversi alat rumah (misal: buku, botol air) ke estimasi beban kg.
4.  **Galeri Progress**: Upload foto perkembangan tubuh (disimpan di browser).
5.  **Pengaturan**: Simpan API Key dan data profil.

## Cara Menggunakan
1.  Buka file `index.html` di browser kamu.
2.  Masuk ke menu **Settings** (ikon gerigi).
3.  Masukkan Nama dan Berat Badan awal.
4.  (Opsional) Masukkan API Key jika ingin menggunakan fitur AI yang sebenarnya. Jika tidak, AI akan menggunakan mode demo terbatas.

## Cara Deploy ke GitHub Pages
1.  Upload semua file ini ke repository GitHub baru.
2.  Buka tab **Settings** di repository GitHub kamu.
3.  Pilih menu **Pages** di sidebar kiri.
4.  Pada bagian **Source**, pilih `Deploy from a branch`.
5.  Pilih branch `main` (atau `master`) dan folder `/ (root)`.
6.  Klik **Save**. Tunggu beberapa menit, website kamu akan live!

## Catatan Penting
*   **Penyimpanan Data**: Semua data (log latihan, foto, setting) disimpan di **Local Storage** browser kamu. Jika kamu menghapus cache browser atau membuka di device lain, data tidak akan muncul. Ini adalah keterbatasan website statis tanpa database server.
*   **Foto**: Foto akan otomatis diperkecil (resize) sebelum disimpan agar tidak memenuhi memori browser.

## Pengembangan Lanjut
Jika ingin fitur lebih canggih (seperti login akun agar data bisa diakses di mana saja), kamu perlu mempelajari **Firebase** atau backend development.
