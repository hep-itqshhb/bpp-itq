# Aktiviti BPP — Kalendar ITQSHHB (Penyegerakan Automatik)

## Status

**Feature website sudah tersedia:** Bahagian Aktiviti kini mempunyai dua seksyen `Akan Berlangsung` (minggu semasa dan minggu hadapan) dan `Telah Berlangsung` (sorotan semasa serta arkib). Fail `aktiviti-kalendar.json` mengandungi snapshot program disahkan bagi 2–15 November 2026.

**Auto-sync belum diaktifkan dalam Google Apps Script pengguna.** Untuk pemindahan data seterusnya secara berjadual, pemilik perlu memasang satu fungsi dan membenarkan pemindahan data melalui akaun Google yang disambungkan.

## Pengaktifan sekali sahaja (gunakan Apps Script Jannah sedia ada)

1. Buka fail Google Sheet `jannah terbaik v4` dan pilih **Extensions → Apps Script**. Gunakan projek yang sudah menyegerakkan ranking Jannah.
2. Dalam editor, tambah fail skrip baru bernama `BPP_Aktiviti_Sync.gs`. Salin kod daripada [sync/aktiviti-sync.gs](aktiviti-sync.gs); jangan ubah atau padam fail ranking sedia ada.
3. Dalam **Project Settings → Script properties**, gunakan `GITHUB_TOKEN` yang **sudah disimpan** untuk ranking. **Jangan cipta token baharu dan jangan tulis token dalam kod atau GitHub.**
4. Tambah Script property bernama **`ITQ_KALENDAR_SHEET_ID`**, dengan value berupa **ID spreadsheet** daripada URL Kalendar ITQSHHB yang telah diberikan oleh pemilik (bahagian antara `/d/` dan `/edit`). Pastikan tiada ruang tambahan.
5. Pilih fungsi `setupBppAktivitiAutoSync` dan klik **Run** sekali. Benarkan skop Google yang diperlukan, jika diminta.
6. Semak menu **Executions**: sepatutnya keluar log `Published ... approved activities` atau `Public activities unchanged; no GitHub commit needed.`
7. Semak menu **Triggers**: fungsi `syncBppAktivitiToGitHub` dipasang dengan event source **Time-driven**, interval **Every hour**. Ini trigger berasingan daripada auto-sync ranking 15 minit.

## Data yang diterbitkan

- Sumber: tab **Aktiviti** dalam Kalendar ITQSHHB.
- Hanya program `Status = Disahkan` dengan tajuk dalam senarai program awam yang dibenarkan; aktiviti logistik seperti pindah unit dan persiapan serta rekod belum disahkan **tidak diterbitkan**.
- Tetingkap masa: **Isnin minggu semasa hingga Ahad minggu hadapan**, mengikut zon waktu `Asia/Brunei`. Skrip memilih semula tetingkap setiap kali disegerakkan.
- Data awam: tajuk, tarikh mula/tamat, masa, kategori, lokasi, kumpulan peserta umum yang diluluskan serta nota umum yang ditapis. **Tiada nama pelajar/petugas, maklumat peribadi atau catatan dalaman**.
- Papan aktiviti secara automatik memisahkan aktiviti telah selesai daripada yang akan datang mengikut waktu Brunei.
- Jika tiada perubahan pada tarikh tetingkap atau acara, tiada commit baharu; jika berubah, skrip hanya mengemas kini `aktiviti-kalendar.json`.

## Penyelenggaraan

- Fail awam: [aktiviti-kalendar.json](../aktiviti-kalendar.json).
- Kod penyegerakan: [aktiviti-sync.gs](aktiviti-sync.gs).
- Laman: https://hep-itqshhb.github.io/bpp-itq/#aktiviti
- Untuk menyenaraikan **program jenis baharu** pada masa hadapan, penyelaras perlu menilai sama ada sesuai untuk hebahan awam dan mengemas kini senarai `publicTitles` dalam Apps Script. Ini mengelakkan catatan dalaman dipaparkan secara tidak sengaja.
- Jika ada HTTP 403, semak `GITHUB_TOKEN` mempunyai kebenaran Contents: Read and write untuk repository `hep-itqshhb/bpp-itq`.
- Jika pembacaan Sheet gagal, semak ID sumber dan akses Google bagi akaun Apps Script.
- Untuk menamatkan auto-sync, padam trigger `syncBppAktivitiToGitHub`. Jangan padam trigger ranking Jannah.
