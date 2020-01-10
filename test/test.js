/*
 * refer to this table for converting stdin keypresses as binary/hex
 * ref: https://www.eso.org/~ndelmott/ascii.html
 */

const test = require( 'tape' )

const stdin = require( 'mock-stdin' ).stdin()
const nfzf = require( '../src/main.js' )

// fix stdin ( can't start with hex )
const _send = stdin.send
stdin.send = function send ( text ) {
  // space + backspace ( net effect no changes to input string )
  const stub = ' \x08'
  return _send.call( stdin, stub + text )
}

log = function () {}

// list of animals for testing
const animals = require( './animals.json' )

// list of youtube search results for testing
const ytr = require( './youtube-search-results.json' )

test( 'select first result', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Apes', 'Apes value' )
  t.equal( r.selected.index, 0, 'Apes index' )
} )

test( 'select last result', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( '\x0A'.repeat( 99 ) + '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Zebras', 'Zebras value' )
  t.equal( r.selected.index, 59, 'Zebras index' )
} )

test( 'select first search result', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'j\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Jaguars', 'Jaguars value' )
  t.equal( r.selected.index, 27, 'Jaguars index' )
} )

test( 'select second search result', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'cro\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Crocodiles', 'Crocodiles value' )
  t.equal( r.selected.index, 9, 'Crocodiles index' )
} )

test( 'select fourth search result', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'ba\x0A\x0A\x0A\x0A\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Cobras', 'Cobras value' )
  t.equal( r.selected.index, 8, 'Cobras index' )
} )

test( 'scroll down 4 (over limit), scroll up 1', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'ho\x0A\x0A\x0A\x0A\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Rhinoceroses', 'Rhinoceroses value' )
  t.equal( r.selected.index, 45, 'Rhinoceroses index' )
} )

test( 'scroll down 4 (over limit), scroll up 8 (over limit)', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A ), ctrl-k ( \x0B )
    stdin.send( 'ho\x0A\x0A\x0A\x0A\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Hippopotami', 'Hippopotami value' )
  t.equal( r.selected.index, 25, 'Hippopotami index' )
} )

test( 'scroll down 4 (over limit), scroll up 8 (over limit)', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A ), ctrl-k ( \x0B )
    stdin.send( 'ho\x0A\x0A\x0A\x0A\x0B\x0B\x0B\x0B\x0B\x0B\x0B\x0B\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Hippopotami', 'Hippopotami value' )
  t.equal( r.selected.index, 25, 'Hippopotami index' )
} )

test( 'scroll down 16 (over page)', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( '\x0A'.repeat( 16 ) + '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Falcons', 'Falcons value' )
  t.equal( r.selected.index, 16, 'Falcons index' )
} )

test( 'one fuzz selection', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'eas' + '\x0A\x0A' + '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Elephants', 'Elephants value' )
  t.equal( r.selected.index, 14, 'Elephants index' )
} )

test( 'multiple fuzz selection', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'e e r m' + '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected.value, 'Lemurs', 'Lemurs value' )
  t.equal( r.selected.index, 30, 'Lemurs index' )
} )

test( 'select nothing in the list (undefined)', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'music' + '\x0A\x0A\x0A' + '\r' )
  } )

  const r = await nfzf( require( '../test/animals.json' ) )
  log( r )

  t.equal( r.selected, undefined, 'undefined selected' )
} )

test( 'youtube search selection', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'music' + '\x0A\x0A\x0A' + '\r' )
  } )

  const r = await nfzf( require( '../test/youtube-search-results.json' ) )
  log( r )

  t.equal( r.selected.value, '    936460 | ~ N I G H T D R I V E ~ A Synthwave Music Video Mix [Chillwave - Retrowave] (45:31) | Euphoric Eugene', '~ N I G H T D R I V E ~' )
  t.equal( r.selected.index, 6, '~ N I G H T D R I V E ~ index' )
} )

test( 'test original index correct', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'r e tro syntwahve' + '\r' )
  } )

  const r = await nfzf( require( '../test/youtube-search-results.json' ) )
  log( r )

  t.equal( r.selected.value, '    936460 | ~ N I G H T D R I V E ~ A Synthwave Music Video Mix [Chillwave - Retrowave] (45:31) | Euphoric Eugene', '~ N I G H T D R I V E ~' )
  t.equal( r.selected.index, 6, '~ N I G H T D R I V E ~ index' )
} )

test( 'test normal mode', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'intend\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '    506658 | 16-Bit Wave • Super Nintendo & Sega Genesis RetroWave Mix (38:13) | Axel Stone', 'Super Nintendo' )
  t.equal( r.selected.index, 9, 'Super Nintendo index' )
} )

test( 'test normal mode multi fiter combination', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-j ( \x0A )
    stdin.send( 'tro ni x chi\x0A\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '    513166 | Interstellar (Chillwave - Retrowave - Electronic Mix) (51:36) | SoulSearchAndDestroy', 'Interstellar' )
  t.equal( r.selected.index, 4, 'Interstellar index' )
} )

test( 'test ctrl-b, ctr-w ( jump back word ) ( delete word )', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-b ( \x02 ) ( back a word )
    // ctrl-w ( \x17 ) ( delete a word )
    stdin.send( 'hjklhjkl music retro\x02\x02\x17\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '    253379 | Paradise Magic Music - \'Back To The 80\'s\' Best of Synthwave And Retro Electro Music (2:01:30) | Paradise Magic Music', 'Paradise Magic Music' )
  t.equal( r.selected.index, 3, 'Paradise Magic Music index' )
} )

test( 'test 日本語, jump forward ( ctrl-f ), jump beginning ( ctrl-a )', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-a ( \x01 ) ( beginning )
    // ctrl-b ( \x02 ) ( back a word )
    // ctrl-f ( \x06 ) ( forward a word )
    // ctrl-w ( \x17 ) ( delete a word )
    stdin.send( '世界　hjklhjkl fan\x01\x06\x06\x17\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '   2587609 | 【癒し効果】天国や異世界で流れる、魔法の音楽【作業用BGM】~ Fantasy Music ~ (43:58) | xxxJunaJunaxxx', 'Fantasy Music' )
  t.equal( r.selected.index, 19, 'Fantasy Music index' )
} )

test( 'test backspace ( ctrl-h )', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-h ( \x08 ) ( backspace )
    stdin.send( 'syntw\x08\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.index, 1, 'Retro Grooves Mix index' )
} )

test( 'test jump to end ( ctrl-e )', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-a ( \x01 ) ( beginning )
    // ctrl-b ( \x02 ) ( back a word )
    // ctrl-e ( \x05 ) ( end )
    // ctrl-f ( \x06 ) ( forward a word )
    // ctrl-w ( \x17 ) ( delete a word )
    stdin.send( 'iza iza iza xxxxx\x01\x05\x17\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  const r = await nfzf( opts )
  log( r )

  t.equal( r.selected.index, 34, 'Izabelle' )
} )
