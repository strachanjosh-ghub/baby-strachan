/**
 * Baby prediction games — storage + email notifications.
 *
 * Handles more than one game. Each game writes to its own tab:
 *   kohler-roberts -> "Predictions"          (the original; unchanged)
 *   strachan       -> "Strachan Predictions"
 * A request with no game is treated as kohler-roberts, so the live
 * Baby Kohler-Roberts site keeps working with no change at its end.
 *
 * Paste this into the Apps Script editor attached to your predictions Sheet
 * (Extensions > Apps Script), then deploy it as a Web app with access set to
 * "Anyone". The app posts every entry here; this script writes the row,
 * blocks duplicate mobile numbers and emails you.
 *
 * Nothing below needs editing except NOTIFY_EMAIL.
 */

var NOTIFY_EMAIL = 'strachan.josh@gmail.com';

var GAMES = {
  'kohler-roberts': { sheet: 'Predictions',          baby: 'Baby Kohler-Roberts' },
  'strachan':       { sheet: 'Strachan Predictions', baby: 'Baby Strachan' }
};
var DEFAULT_GAME = 'kohler-roberts';

function gameOf_(key) {
  return GAMES[String(key || DEFAULT_GAME).toLowerCase()] || GAMES[DEFAULT_GAME];
}

var HEADERS = [
  'Submitted', 'Name', 'Mobile', 'Birth date', 'Birth hour', 'Weight (kg)',
  'Sex', 'Name guess', 'Length', 'Hair', 'Eyes', 'Labour',
  'Updated', 'Revisions'
];


/* ------------------------------------------------------------------ setup */

function getSheet_(game) {
  var name = gameOf_(game).sheet;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // A tab created before the Updated/Revisions columns existed gains them here,
  // so an older game keeps working without anyone touching the sheet.
  var lastCol = sheet.getLastColumn();
  if (lastCol < HEADERS.length) {
    sheet.getRange(1, lastCol + 1, 1, HEADERS.length - lastCol)
         .setValues([HEADERS.slice(lastCol)]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Mobile numbers are stored as text so a leading zero survives. */
function normaliseMobile_(raw) {
  var d = String(raw == null ? '' : raw).replace(/[^\d+]/g, '');
  if (d.indexOf('+61') === 0) d = '0' + d.slice(3);
  else if (d.indexOf('61') === 0 && d.length === 11) d = '0' + d.slice(2);
  d = d.replace(/\D/g, '');
  if (d.length === 9 && d.charAt(0) === '4') d = '0' + d;
  return d;
}

function readEntries_(game) {
  var sheet = getSheet_(game);
  if (sheet.getLastRow() < 2) return [];

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();

  return rows.map(function (r, i) { r._row = i + 2; return r; })
             .filter(function (r) { return r[2]; }).map(function (r) {
    return {
      row:         r._row,
      updatedAt:   r[12] instanceof Date ? r[12].toISOString() : (r[12] ? String(r[12]) : ''),
      revisions:   Number(r[13] || 0),
      submittedAt: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name:        String(r[1]),
      mobile:      normaliseMobile_(r[2]),
      birthDate:   r[3] instanceof Date ? Utilities.formatDate(r[3], 'Australia/Melbourne', 'yyyy-MM-dd') : String(r[3]),
      birthHour:   r[4] === '' ? null : Number(r[4]),
      weightKg:    Number(r[5]),
      sex:         String(r[6]),
      firstName:   String(r[7]),
      length:      String(r[8]),
      hair:        String(r[9]),
      eyes:        String(r[10]),
      labour:      String(r[11])
    };
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ------------------------------------------------------------- read (GET) */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var game   = (e && e.parameter && e.parameter.game) || DEFAULT_GAME;

  try {
    if (action === 'check') {
      var mobile = normaliseMobile_(e.parameter.mobile);
      var hit = readEntries_(game).filter(function (r) { return r.mobile === mobile; })[0];
      return json_({ ok: true, exists: !!hit, entry: hit || null });
    }

    if (action === 'list') {
      return json_({ ok: true, entries: readEntries_(game) });
    }

    // Creates the game's tab with its headers if it does not exist yet.
    if (action === 'setup') {
      var sh = getSheet_(game);
      return json_({ ok: true, sheet: sh.getName(), rows: Math.max(sh.getLastRow() - 1, 0) });
    }

    return json_({ ok: true, status: 'Predictions endpoint is live.',
                   games: Object.keys(GAMES) });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}


/* ------------------------------------------------------------ write (POST) */

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    // Two guests submitting at the same instant must not both pass the
    // duplicate check, so the whole read-check-write runs under a lock.
    lock.waitLock(20000);

    var body   = JSON.parse(e.postData.contents);
    var record = body.record || {};
    var game   = body.game || DEFAULT_GAME;
    var mobile = normaliseMobile_(record.mobile);

    if (!mobile) return json_({ ok: false, error: 'Missing mobile number.' });

    // Each game is scored separately, so the same mobile may enter both.
    var replace  = body.replace === true;
    var existing = readEntries_(game).filter(function (r) { return r.mobile === mobile; })[0];

    // Without an explicit replace, an existing entry stands.
    if (existing && !replace) {
      return json_({ ok: true, duplicate: true, entry: existing });
    }

    var now  = new Date();
    var sh   = getSheet_(game);
    var vals = [
      existing ? new Date(existing.submittedAt)       // the first guess keeps its own date
               : (record.submittedAt ? new Date(record.submittedAt) : now),
      record.name || '',
      "'" + mobile,                 // leading apostrophe keeps it text in Sheets
      record.birthDate || '',
      record.birthHour === null || record.birthHour === undefined ? '' : record.birthHour,
      record.weightKg || '',
      record.sex || '',
      record.firstName || '',
      record.length || '',
      record.hair || '',
      record.eyes || '',
      record.labour || '',
      existing ? now : '',                            // Updated: the recapture date
      existing ? existing.revisions + 1 : 0
    ];

    if (existing) {
      sh.getRange(existing.row, 1, 1, HEADERS.length).setValues([vals]);
    } else {
      sh.appendRow(vals);
    }

    // The row is saved before the email is attempted, so a mail failure
    // can never lose someone's entry.
    try {
      if (body.email && body.email.subject) {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: body.email.subject,
          body: body.email.text
        });
      }
    } catch (mailErr) {
      return json_({ ok: true, saved: true, emailed: false, updated: !!existing,
                     revisions: existing ? existing.revisions + 1 : 0, error: String(mailErr) });
    }

    return json_({ ok: true, saved: true, emailed: true,
                   updated: !!existing,
                   revisions: existing ? existing.revisions + 1 : 0 });

  } catch (err) {
    return json_({ ok: false, error: String(err) });

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


/* -------------------------------------------------------------- self-test */

/**
 * Run this once from the editor after deploying. It writes a test row,
 * reads it back, emails you, then removes the row.
 */
function testSetup(game) {
  game = game || DEFAULT_GAME;
  var sheet = getSheet_(game);

  var fake = {
    record: {
      submittedAt: new Date().toISOString(),
      name: 'Test Entry', mobile: '0400000000', birthDate: '2026-11-07',
      birthHour: 14, weightKg: 3.5, sex: 'Girl', firstName: 'Test',
      length: '51-53 cm', hair: 'Hair', eyes: 'Blue', labour: '8-16 hrs'
    },
    email: {
      subject: gameOf_(game).baby + ' — test notification',
      text: 'If this arrived, the notification email works. The test row has been removed.'
    }
  };

  fake.game = game;
  var res = doPost({ postData: { contents: JSON.stringify(fake) } });
  Logger.log('POST: ' + res.getContent());
  Logger.log('CHECK: ' + doGet({ parameter: { action: 'check', mobile: '0400 000 000', game: game } }).getContent());

  var rows = sheet.getRange(2, 3, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normaliseMobile_(rows[i][0]) === '0400000000') sheet.deleteRow(i + 2);
  }
  Logger.log('Test row removed from "' + sheet.getName() + '". Entries now: ' + readEntries_(game).length);
}

/** Creates every game's tab if missing. Safe to run any time. */
function setupAllGames() {
  Object.keys(GAMES).forEach(function (k) {
    Logger.log(k + ' -> ' + getSheet_(k).getName());
  });
}
