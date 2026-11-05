/**
 * BPP ITQSHHB — auto-sync Ranking Jannah (aggregate scores only).
 *
 * Install as a spreadsheet-bound Google Apps Script:
 *   1. Extensions > Apps Script in "jannah terbaik v4".
 *   2. Paste this file into a new .gs script (do not overwrite existing code).
 *   3. In Project Settings > Script properties set GITHUB_TOKEN.
 *   4. Run setupJannahRankingAutoSync() once and grant permissions.
 *
 * NEVER place a token in this file, GitHub, or a public web page.
 */
var BPP_JANNAH_SYNC = Object.freeze({
  owner: 'hep-itqshhb',
  repository: 'bpp-itq',
  branch: 'main',
  path: 'jannah-ranking.json',
  tab: 'Ranking Jannah'
});

function setupJannahRankingAutoSync() {
  var boundSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!boundSpreadsheet) throw new Error('Open this Apps Script from jannah terbaik v4.');
  PropertiesService.getScriptProperties().setProperty('JANNAH_SOURCE_SHEET_ID', boundSpreadsheet.getId());
  // Test the connection FIRST: do not install a failing recurring trigger.
  syncJannahRankingToGitHub();
  var existing = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'syncJannahRankingToGitHub';
  });
  if (!existing) {
    ScriptApp.newTrigger('syncJannahRankingToGitHub')
      .timeBased()
      .everyMinutes(15)
      .create();
  }
  console.log('BPP ranking auto-sync is enabled (every 15 minutes).');
}

function syncJannahRankingToGitHub() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    console.log('Skipped: another ranking synchronization is running.');
    return;
  }

  try {
    var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    if (!token || !token.trim()) {
      throw new Error('Missing GITHUB_TOKEN. Set it in Apps Script Project Settings > Script properties.');
    }

    var sourceId = PropertiesService.getScriptProperties().getProperty('JANNAH_SOURCE_SHEET_ID');
    var spreadsheet = sourceId ? SpreadsheetApp.openById(sourceId) : SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Source Sheet unavailable. Run setupJannahRankingAutoSync again from the bound spreadsheet.');
    var sheet = spreadsheet.getSheetByName(BPP_JANNAH_SYNC.tab);
    if (!sheet) throw new Error('Cannot find the Ranking Jannah tab.');

    // Read only column B (Jannah) and column O (Jumlah Markah), rows 2–5.
    // No student names, discipline cases, or individual records are published.
    var rows = sheet.getRange('B2:O5').getValues();
    var canonicalNames = ['Ma’wa', 'Na’im', 'Adnin', 'Firdaus'];
    var aliases = { "ma'wa": 'Ma’wa', "na'im": 'Na’im', adnin: 'Adnin', firdaus: 'Firdaus' };
    var pointsByName = {};

    rows.forEach(function (row) {
      var input = String(row[0] || '').trim().replace(/[\u2018\u2019]/g, "'").toLowerCase();
      var name = aliases[input];
      if (!name || Object.prototype.hasOwnProperty.call(pointsByName, name)) {
        throw new Error('Unexpected or repeated Jannah name in Ranking Jannah: ' + input);
      }
      var rawPoints = row[13]; // O, where the reading begins in B.
      var points = typeof rawPoints === 'number'
        ? rawPoints
        : Number(String(rawPoints).replace(/,/g, '').trim());
      if (!Number.isInteger(points) || points < 0 || points > 10000000) {
        throw new Error('Invalid score for ' + name + ': ' + rawPoints);
      }
      pointsByName[name] = points;
    });

    if (canonicalNames.some(function (name) { return !Object.prototype.hasOwnProperty.call(pointsByName, name); })) {
      throw new Error('Missing one or more of the four Jannah scores.');
    }

    var url = 'https://api.github.com/repos/' + BPP_JANNAH_SYNC.owner + '/' +
      BPP_JANNAH_SYNC.repository + '/contents/' + BPP_JANNAH_SYNC.path;
    var headers = {
      Authorization: 'Bearer ' + token.trim(),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'BPP-Jannah-AutoSync'
    };

    var getResponse = UrlFetchApp.fetch(url + '?ref=' + BPP_JANNAH_SYNC.branch, {
      method: 'get', headers: headers, muteHttpExceptions: true
    });
    if (getResponse.getResponseCode() !== 200) {
      throw new Error('GitHub read failed (HTTP ' + getResponse.getResponseCode() +
        '). Check token access to this repository.');
    }

    var remote = JSON.parse(getResponse.getContentText());
    if (!remote.sha || !remote.content) throw new Error('GitHub returned an unexpected file response.');
    var decoded = Utilities.newBlob(
      Utilities.base64Decode(remote.content.replace(/\s/g, ''))
    ).getDataAsString('UTF-8');
    var previous = JSON.parse(decoded);
    var previousScores = {};
    (previous.houses || []).forEach(function (house) {
      previousScores[house.name] = house.points;
    });

    // Idempotent: avoid unnecessary commits and Pages deployments.
    if (previous.schemaVersion === 1 &&
        previous.source === 'jannah terbaik v4' &&
        previous.sourceTab === BPP_JANNAH_SYNC.tab &&
        canonicalNames.every(function (name) { return previousScores[name] === pointsByName[name]; })) {
      console.log('Ranking unchanged. No GitHub commit needed.');
      return;
    }

    var next = {
      schemaVersion: 1,
      source: 'jannah terbaik v4',
      sourceTab: BPP_JANNAH_SYNC.tab,
      updatedAt: new Date().toISOString(),
      houses: canonicalNames.map(function (name) {
        return { name: name, points: pointsByName[name] };
      })
    };
    var newContent = Utilities.base64Encode(
      JSON.stringify(next, null, 2) + '\n', Utilities.Charset.UTF_8
    );
    var putResponse = UrlFetchApp.fetch(url, {
      method: 'put',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify({
        message: 'chore(bpp): auto-sync Jannah ranking from verified Google Sheet',
        branch: BPP_JANNAH_SYNC.branch,
        sha: remote.sha,
        content: newContent
      }),
      muteHttpExceptions: true
    });
    if (putResponse.getResponseCode() !== 200) {
      throw new Error('GitHub write failed (HTTP ' + putResponse.getResponseCode() +
        '). Verify repository Contents: Read and write permission.');
    }
    console.log('Published new aggregate Jannah scores to GitHub successfully.');
  } finally {
    lock.releaseLock();
  }
}
