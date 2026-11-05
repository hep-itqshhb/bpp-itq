# Website BPP — GitHub Pages

Website statik, responsif dan tanpa pemasangan tambahan. Buka index.html untuk pratonton.

## Terbitkan melalui GitHub Pages
1. Cipta repository GitHub bernama `bpp-itq`. Pilih Public jika menggunakan GitHub Free.
2. Muat naik `index.html` ke akar repository (bukan ZIP atau folder pembungkus).
3. Buka Settings → Pages → Build and deployment.
4. Pilih Deploy from a branch, branch main, folder /(root), kemudian Save.
5. Tunggu deployment selesai. Alamat akan dipaparkan pada halaman Pages, lazimnya https://hep-itqshhb.github.io/bpp-itq/.

Panduan rasmi: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Aktiviti ITQ — dua minggu bergerak

- Bahagian Aktiviti di halaman utama mempunyai dua seksyen: **Akan Berlangsung** (minggu ini dan minggu hadapan) serta **Telah Berlangsung** (aktiviti yang selesai dan sorotan terdahulu).
- Sumber data awam: `aktiviti-kalendar.json`, ringkasan program disahkan daripada tab `Aktiviti` dalam fail **Kalendar ITQSHHB**. Tidak memuatkan nama pelajar, catatan dalaman atau data disiplin.
- Laman membaca fail JSON secara automatik; minggu dikira mengikut waktu Brunei. Skrip satu kali persediaan untuk mengemas kini JSON setiap jam telah disediakan di [panduan aktiviti](sync/AKTIVITI_SETUP.md).
- **Auto-sync aktiviti belum aktif sehingga skrip dipasang dan `setupBppAktivitiAutoSync` dijalankan dalam Apps Script oleh pemilik.** Ranking Jannah menggunakan trigger berasingan.

## Kemas kini
- Teks, warna dan susunan berada dalam index.html.
- Cari `const JANNAH`. Tukar nilai `points:null` kepada nombor yang disahkan; isi `updated` dengan tarikh data sebenar.
- Kedudukan disusun automatik apabila semua empat nilai markah tersedia. Nilai seri mendapat kedudukan sama.
- Ranking pada laman dibaca daripada `jannah-ranking.json`. Fail ini bermula sebagai snapshot daripada Google Sheet; penyegerakan automatik setiap 15 minit tersedia **selepas persediaan sekali sahaja** melalui Google Apps Script dan token GitHub dengan kebenaran terhad. [Panduan pengaktifan](sync/README.md).
- Logo asal BPP telah dimasukkan. Foto asal empat MVP telah diambil daripada PDF yang dibekalkan dan dipadankan dengan label nama asal.
- Data MVP berdasarkan teks Canva Penggal 1–3 2026; bukan kedudukan semasa. Skor empat Jannah sahaja diterbitkan secara agregat melalui `jannah-ranking.json`.
- Semak nama, markah, kandungan dan kesesuaian penerbitan sebelum menanggalkan label pratonton.

## Asas kandungan
Reka bentuk Canva BPP milik pengguna.
Visi dan misi dikekalkan. Placeholder template dibuang; penerangan dipendekkan. Empat aktiviti dipilih sebagai sorotan. Jumlah markah disemak dengan tab Ranking Jannah dan Dashboard dalam jannah terbaik v4 pada 18 September 2026: Adnin 525, Ma'wa 492, Firdaus 398, Na'im 397. Ini salinan data semasa, bukan sambungan automatik. Rekod pelajar dan disiplin individu tidak disalin ke website.


## Visual assets
Campus day and night illustrations and four Jannah emblems supplied by the site owner. MVP portraits extracted with their original transparency from the supplied Pembangunan Pelajar PDF; names matched to the labelled PDF layout. Original BPP logo retained. Scores remain a verified Google Sheet snapshot, not an automatic live feed.

## Theme update
Black and purple theme requested by the owner. Four Jannah logos now use transparent PNG versions produced with the built-in image editor. Original JPEGs retained. Prompt: remove rectangular backgrounds, preserve original emblem colors, shapes and lettering, output transparent alpha.
