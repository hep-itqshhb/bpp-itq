/**
 * ITQSHHB Public Activities -> BPP GitHub Pages
 * Install as a new .gs file in the EXISTING jannah terbaik v4 Apps Script project.
 * Required Script properties:
 *   GITHUB_TOKEN           (already used by Jannah sync; do not duplicate)
 *   ITQ_KALENDAR_SHEET_ID  (the private Kalendar ITQSHHB spreadsheet ID)
 *
 * Public data is tightly restricted: confirmed, whitelisted event titles;
 * no officer names, student names, phone numbers, notes, or private Sheet URLs.
 */
var BPP_AKTIVITI_CONFIG = {
  repo: 'hep-itqshhb/bpp-itq',
  branch: 'main',
  path: 'aktiviti-kalendar.json',
  sourceTab: 'Aktiviti',
  timezone: 'Asia/Brunei'
};

function setupBppAktivitiAutoSync() {
  // Verify the Sheet and GitHub access before creating a recurring trigger.
  syncBppAktivitiToGitHub();
  var exists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'syncBppAktivitiToGitHub';
  });
  if (!exists) {
    ScriptApp.newTrigger('syncBppAktivitiToGitHub').timeBased().everyHours(1).create();
  }
  console.log('BPP public calendar auto-sync enabled. Runs every hour.');
}

function syncBppAktivitiToGitHub() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    console.log('Another BPP sync is still running; skipped.');
    return;
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('GITHUB_TOKEN');
    var sourceId = props.getProperty('ITQ_KALENDAR_SHEET_ID');
    if (!token || !token.trim()) throw new Error('Missing GITHUB_TOKEN Script property.');
    if (!sourceId || !sourceId.trim()) throw new Error('Missing ITQ_KALENDAR_SHEET_ID Script property.');

    var source = SpreadsheetApp.openById(sourceId.trim());
    var sheet = source.getSheetByName(BPP_AKTIVITI_CONFIG.sourceTab);
    if (!sheet) throw new Error('Tab Aktiviti not found in the ITQ calendar.');
    var lastRow = sheet.getLastRow();
    var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 14).getValues() : [];
    var tz = BPP_AKTIVITI_CONFIG.timezone;
    var day = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    var today = new Date(day + 'T00:00:00Z');
    var mon = new Date(today.getTime());
    mon.setUTCDate(mon.getUTCDate() - (mon.getUTCDay() + 6) % 7);
    var sun = new Date(mon.getTime());
    sun.setUTCDate(sun.getUTCDate() + 13);
    var from = Utilities.formatDate(mon, 'UTC', 'yyyy-MM-dd');
    var to = Utilities.formatDate(sun, 'UTC', 'yyyy-MM-dd');

    // Curated public activity titles; add newly approved programme names here.
    // Do NOT change to "publish every row": the calendar includes private logistics.
    var publicTitles = [
      /^Kelas Al-Quran secara Online/i, /^Bengkel Khalifah/i,
      /^Bengkel Fotografi/i, /^Bengkel Dikir/i, /^Bengkel Media/i,
      /^Lawatan Ilmiah/i, /^Program Qudwah Hasanah/i,
      /^Hari Keusahawanan/i, /^BN On The Move/i,
      /^Sukan Ria Hari Guru/i, /^Final Musabaqah Tilawah/i,
      /^Musabaqah Hafazan/i, /^Musabaqah Minda/i,
      /^Majlis Penutup Persekolahan/i, /^Majlis Penutup Halaqah/i,
      /^Majlis Pelajar Cemerlang/i, /^Pertandingan Dikir/i,
      /^Teambuilding Warga/i, /^Malam Cinta Rasul/i,
      /^Halal Awareness/i, /^Majlis Penerimaan Pelajar Baharu/i,
      /^Hari Terbuka/i, /^Sukan Tahunan/i
    ];
    function ymd(raw) {
      if (raw instanceof Date) return Utilities.formatDate(raw, tz, 'yyyy-MM-dd');
      var value = String(raw || '').trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    }
    function clock(raw) {
      if (raw instanceof Date) return Utilities.formatDate(raw, tz, 'HH:mm');
      var value = String(raw || '').trim();
      return /^\d{1,2}:\d{2}$/.test(value) ? value.padStart(5, '0') : '';
    }
    function publicName(title) {
      if (/^Kelas Al-Quran secara Online/i.test(title)) return 'Kelas Al-Quran Dalam Talian';
      if (/^Bengkel Media - /i.test(title)) return title.replace(/^Bengkel Media - /i,'Bengkel Media: ');
      if (/^BN On The Move/i.test(title)) return 'BN On The Move & Walkathon Warga ITQ';
      return title.trim();
    }
    function publicAudience(raw) {
      var permitted = [
        'Pelajar Tahun 7 hingga 10', 'Pelajar, Pelajar Tahun 7 hingga 10',
        'Nadi DTAQ & MPP', 'Nadi DTAQ & MPP, Pelajar Tahun 7 hingga 10',
        'Nadi Media DTAQ & Biro Media MPP',
        '10 orang media, Nadi Media DTAQ & Biro Media MPP',
        'Tahun 7L dan Tahun 8L', 'Tahun 7P dan Tahun 8P',
        'Semua Pelajar', 'Semua', 'Warga ITQSHHB', 'Warga ITQSHHB, Semua',
        'Pelajar Tahun 7 hingga 10, Pegawai, Guru'
      ];
      var value = String(raw || '').trim();
      return permitted.indexOf(value) !== -1 ? value : '';
    }

    var events = data.filter(function(r) {
      if (String(r[13] || '').trim() !== 'Disahkan') return false;
      var title = String(r[1] || '').trim();
      if (!title || !publicTitles.some(function(re) { return re.test(title); })) return false;
      var start = ymd(r[3]), end = ymd(r[4]) || start;
      return !!start && !!end && start <= end && start <= to && end >= from;
    }).map(function(r) {
      var title = String(r[1]).trim();
      var event = {
        title: publicName(title),
        start: ymd(r[3]),
        end: ymd(r[4]) || ymd(r[3]),
        startTime: clock(r[5]),
        endTime: /^Kelas Al-Quran secara Online/i.test(title) ? '' : clock(r[6]),
        category: String(r[2] || '').trim().slice(0, 40),
        venue: String(r[9] || '').trim().replace(/Makmal Computer/i,'Makmal Komputer').slice(0, 100),
        audience: publicAudience(r[10])
      };
      if (/^BN On The Move/i.test(title)) event.info = 'Kelas Al-Quran bermula 7.00 pagi';
      return event;
    }).sort(function(a,b) {
      return a.start.localeCompare(b.start) ||
        a.startTime.localeCompare(b.startTime) ||
        a.title.localeCompare(b.title);
    });

    var baseUrl = 'https://api.github.com/repos/' + BPP_AKTIVITI_CONFIG.repo +
      '/contents/' + BPP_AKTIVITI_CONFIG.path;
    var headers = {
      Authorization: 'Bearer ' + token.trim(),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'BPP-Activities-AutoSync'
    };
    var get = UrlFetchApp.fetch(baseUrl + '?ref=' + BPP_AKTIVITI_CONFIG.branch, {
      method:'get',headers:headers,muteHttpExceptions:true
    });
    if (get.getResponseCode() !== 200) {
      throw new Error('Could not read GitHub activities JSON (HTTP ' + get.getResponseCode() + ').');
    }
    var remote = JSON.parse(get.getContentText());
    if (!remote.sha || !remote.content) throw new Error('Unexpected GitHub file response.');
    var previous = JSON.parse(Utilities.newBlob(
      Utilities.base64Decode(remote.content.replace(/\s/g, ''))
    ).getDataAsString('UTF-8'));

    // Skip a commit when the 2-week window and the public event list are unchanged.
    function project(e) {
      var result = {
        title:e.title,start:e.start,end:e.end,startTime:e.startTime||'',
        endTime:e.endTime||'',category:e.category||'',venue:e.venue||'',
        audience:e.audience||''
      };
      if (e.info) result.info=e.info;
      return result;
    }
    var priorList=(previous.events || []).map(project);
    if (previous.schemaVersion===1 &&
        previous.source==='Kalendar ITQSHHB' &&
        previous.sourceTab===BPP_AKTIVITI_CONFIG.sourceTab &&
        previous.dateWindow && previous.dateWindow.from===from && previous.dateWindow.to===to &&
        JSON.stringify(priorList)===JSON.stringify(events)) {
      console.log('Public activities unchanged; no GitHub commit needed.');
      return;
    }
    var next = {
      schemaVersion:1,
      source:'Kalendar ITQSHHB',
      sourceTab:BPP_AKTIVITI_CONFIG.sourceTab,
      dateWindow:{from:from,to:to},
      lastSyncedAt:new Date().toISOString(),
      events:events
    };
    var payload = Utilities.base64Encode(
      JSON.stringify(next,null,2)+'\n',Utilities.Charset.UTF_8
    );
    var put = UrlFetchApp.fetch(baseUrl,{
      method:'put',headers:headers,contentType:'application/json',
      payload:JSON.stringify({
        message:'chore(bpp): update approved public calendar activities',
        branch:BPP_AKTIVITI_CONFIG.branch,sha:remote.sha,content:payload
      }),
      muteHttpExceptions:true
    });
    if (put.getResponseCode()!==200) {
      throw new Error('Could not update GitHub activities JSON (HTTP '+put.getResponseCode()+').');
    }
    console.log('Published '+events.length+' approved activities to BPP GitHub.');
  } finally {
    lock.releaseLock();
  }
}
