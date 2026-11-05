# Auto-sync Ranking Jannah — BPP ITQSHHB

## Status

Kod dan fail data awam sudah disediakan dalam repositori GitHub.
**Sinkronisasi berkala belum aktif sehingga pemilik Google Sheet memasang dan membenarkan Google Apps Script sekali sahaja.**

Aliran selepas diaktifkan:

1. Google Sheet **jannah terbaik v4** → tab **Ranking Jannah**, lajur B (Jannah) dan O (Jumlah Markah), baris 2–5.
2. Google Apps Script membaca empat skor setiap **15 minit**.
3. Jika skor berubah, Apps Script mengemas kini hanya `jannah-ranking.json` menggunakan GitHub Contents API.
4. GitHub Pages membaca JSON itu apabila laman BPP dibuka.
5. Jika skor tidak berubah, tiada commit baharu. Jika JSON gagal dimuatkan, laman memaparkan skor sandaran terakhir dalam `index.html`.

**Keselamatan:** Google Sheet kekal peribadi. Tiada akses awam kepada tab Disiplin, nama pelajar atau rekod individu. Hanya nama empat Jannah, markah terkumpul dan tarikh kemas kini diterbitkan.

## Persediaan sekali sahaja

### 1. Cipta token GitHub yang terhad

1. Log masuk GitHub dan buka [Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens).
2. Pilih **Generate new token**.
3. **Resource owner:** `hep-itqshhb`. Jika organisasi memerlukan kelulusan token, selesaikan kelulusan melalui GitHub.
4. **Repository access:** *Only select repositories* → `bpp-itq`.
5. **Repository permissions → Contents:** *Read and write*. Jangan berikan permission lain yang tidak perlu.
6. Tetapkan tarikh luput yang sesuai. **Simpan token hanya dalam Google Apps Script Script properties. Jangan kongsi token dalam chat atau commit GitHub.**

### 2. Pasang Google Apps Script

1. Buka fail [jannah terbaik v4](https://docs.google.com/spreadsheets/d/1dBtPu32h1FkT4XuW3pTaxzs2ryMrM00pRuB-eZh_W_c/edit).
2. Pilih **Extensions → Apps Script**.
3. Cipta fail skrip baharu, contohnya `BPP_Jannah_Sync.gs`, supaya kod sedia ada tidak ditimpa.
4. Salin **keseluruhan** kod daripada [sync/jannah-sync.gs](https://github.com/hep-itqshhb/bpp-itq/blob/main/sync/jannah-sync.gs).
5. Klik **Save**.

### 3. Simpan token secara peribadi

1. Dalam Apps Script, klik **Project Settings** (ikon gear).
2. Di bahagian **Script properties**, klik **Add script property**.
3. **Property:** `GITHUB_TOKEN`.
4. **Value:** token GitHub tadi.
5. Simpan. Jangan letakkan token secara literal dalam source code.

### 4. Aktifkan jadual dan sahkan

1. Dalam editor Apps Script, pilih fungsi `setupJannahRankingAutoSync`.
2. Klik **Run** dan berikan kebenaran Google yang diminta.
3. Fungsi menjalankan semakan pertama dan memasang *time-driven trigger* setiap 15 minit. Menjalankannya sekali lagi tidak mencipta trigger pendua.
4. Buka **Triggers** untuk mengesahkan fungsi `syncJannahRankingToGitHub` dijadualkan setiap 15 minit.
5. Buka **Executions** untuk melihat status kejayaan atau ralat.

Selepas itu, apabila markah berubah dalam Sheet, skrip akan mengemas kini fail JSON pada kitaran seterusnya. Penerbitan GitHub Pages juga memerlukan masa pemprosesan sendiri.

## Menyemak dan memulihkan

- Fail data awam: [jannah-ranking.json](https://github.com/hep-itqshhb/bpp-itq/blob/main/jannah-ranking.json)
- Laman web: [BPP ITQ](https://hep-itqshhb.github.io/bpp-itq/#jannah)
- Jika status HTTP 401/403: semak token tamat tempoh, pemilik token dan permission `Contents: Read and write`.
- Jika Apps Script gagal: buka **Executions** untuk ralat, kemudian jalankan semula `setupJannahRankingAutoSync` setelah membetulkan puncanya.
- Untuk menghentikan auto-sync: padam trigger `syncJannahRankingToGitHub` dalam Apps Script. Batalkan token GitHub jika tidak diperlukan.

Rujukan teknikal: [Google ClockTriggerBuilder](https://developers.google.com/apps-script/reference/script/clock-trigger-builder), [Google Installable Triggers](https://developers.google.com/apps-script/guides/triggers/installable), [GitHub Contents API](https://docs.github.com/en/rest/repos/contents).
