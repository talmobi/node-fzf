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
// log = console.log

// list of animals for testing
const animals = require( './animals.json' )

const fs = require( 'fs' )
const path = require( 'path' )

// list of youtube search results for testing
const ytr = require( './youtube-search-results.json' )

test( 'package.json main path correct', function ( t ) {
  t.plan( 1 )

  try {
    const pkg = require( path.join( __dirname, '../package.json' ) )
    const stat = fs.statSync( path.join( __dirname, '../', pkg.main ) )
    t.ok( stat )
  } catch ( err ) {
    t.fail( err )
  }
} )

test( 'package.json bin path correct', function ( t ) {
  t.plan( 1 )

  try {
    const pkg = require( path.join( __dirname, '../package.json' ) )
    const stat = fs.statSync( path.join( __dirname, '../', pkg.bin.nfzf ) )
    t.ok( stat )
  } catch ( err ) {
    t.fail( err )
  }
} )

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

test( 'test ctrl-s mode switching', async function ( t ) {
  t.plan( 2 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    // ctrl-a ( \x01 ) ( beginning )
    // ctrl-b ( \x02 ) ( back a word )
    // ctrl-e ( \x05 ) ( end )
    // ctrl-f ( \x06 ) ( forward a word )
    // ctrl-s ( \x13 ) ( switch modes )
    // ctrl-w ( \x17 ) ( delete a word )
    stdin.send( 'msl bo\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  let r = await nfzf( opts )
  log( r )

  t.equal( r.selected, undefined, 'nothing found in normal mode' )

  opts.mode = 'fuzzy'

  // prepare the same user input that will result
  // in a result in 'fuzzy' mode
  process.nextTick( function () {
    stdin.send( 'msl bo\r' )
  } )

  r = await nfzf( opts )
  log( r )

  t.equal( r.selected.index, 3, 'Paradise Music found in fuzzy mode' )
} )

test( 'test api update', async function ( t ) {
  t.plan( 6 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( '\r' )
  } )

  const opts = {
    mode: 'normal',
    list: require( '../test/youtube-search-results.json' )
  }

  nfzf( opts, function ( r ) {
    log( r )

    t.equal( r.selected.value, '    161745 | Earmake - Sensual/ Sensual (Vapor) (9:34) | NewRetroWave', 'selected youtube-search-result' )
    t.equal( opts.list[ 0 ], r.selected.value, 'opts.list still the same' )

    const api = nfzf( opts, function ( r ) {
      log( r )

      // a new result because the list was updated
      t.equal( r.selected.value, 'Apes', 'selected animals' )
      t.equal( opts.list[ 0 ], 'Apes', 'opts.list was updated' )

      t.equal( opts.update, api.update, 'opts.update === api.update' )
      t.equal( opts, api, 'opts === api' )
    } )

    // update list to be of animals now instead
    api.update( require( '../test/animals.json' ) )

    // prepare the same user input that will now select
    // a new result because the list was updated
    process.nextTick( function () {
      stdin.send( '\r' )
    } )
  } )
} )

test( 'test promise api update', async function ( t ) {
  t.plan( 4 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( '\r' )
  } )

  const opts = {
    list: require( '../test/youtube-search-results.json' )
  }

  let r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '    161745 | Earmake - Sensual/ Sensual (Vapor) (9:34) | NewRetroWave', 'selected youtube-search-result' )
  t.equal( opts.list[ 0 ], r.selected.value, 'opts.list still the same' )

  setTimeout( function () {
    // update list to be of animals now instead
    opts.update( require( '../test/animals.json' ) )

    // prepare the same user input that will now select
    // a new result because the list was updated
    process.nextTick( function () {
      stdin.send( '\r' )
    } )
  }, 100 )

  r = await nfzf( opts )
  log( r )

  // a new result because the list was updated
  t.equal( r.selected.value, 'Apes', 'selected animals' )
  t.equal( opts.list[ 0 ], 'Apes', 'opts.list was updated' )
} )

test( 'test api update as plain array', async function ( t ) {
  t.plan( 7 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( '\r' )
  } )

  // opts is now a plain JavaScript array, should work the same
  const opts = require( '../test/youtube-search-results.json' )

  t.ok( Array.isArray( opts ), 'is plain array' )

  nfzf( opts, function ( r ) {
    log( r )

    t.equal( r.selected.value, '    161745 | Earmake - Sensual/ Sensual (Vapor) (9:34) | NewRetroWave', 'selected youtube-search-result' )
    t.equal( opts.list[ 0 ], r.selected.value, 'opts.list still the same' )

    const api = nfzf( opts, function ( r ) {
      log( r )

      // a new result because the list was updated
      t.equal( r.selected.value, 'Apes', 'selected animals' )
      t.equal( opts.list[ 0 ], 'Apes', 'opts.list was updated' )

      t.equal( opts.update, api.update, 'opts.update === api.update' )
      t.equal( opts, api, 'opts === api' )
    } )

    // update list to be of animals now instead
    api.update( require( '../test/animals.json' ) )

    // prepare the same user input that will now select
    // a new result because the list was updated
    process.nextTick( function () {
      stdin.send( '\r' )
    } )
  } )
} )

test( 'test promise api update as plain array', async function ( t ) {
  t.plan( 5 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( '\r' )
  } )

  // opts is now a plain JavaScript array, should work the same
  const opts = require( '../test/youtube-search-results.json' )

  t.ok( Array.isArray( opts ), 'is plain array' )

  let r = await nfzf( opts )
  log( r )

  t.equal( r.selected.value, '    161745 | Earmake - Sensual/ Sensual (Vapor) (9:34) | NewRetroWave', 'selected youtube-search-result' )
  t.equal( opts.list[ 0 ], r.selected.value, 'opts.list still the same' )

  setTimeout( function () {
    // update list to be of animals now instead
    opts.update( require( '../test/animals.json' ) )

    // prepare the same user input that will now select
    // a new result because the list was updated
    process.nextTick( function () {
      stdin.send( '\r' )
    } )
  }, 100 )

  r = await nfzf( opts )
  log( r )

  // a new result because the list was updated
  t.equal( r.selected.value, 'Apes', 'selected animals' )
  t.equal( opts.list[ 0 ], 'Apes', 'opts.list was updated' )
} )

test( 'test getInput callback', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'Mollie T. Muriel\r' )
  } )

  nfzf.getInput( 'Name: ', function ( r ) {
    log( r )
    t.equal( r.query, 'Mollie T. Muriel' )
  } )
} )

test( 'test opts.nolist, opts.label callback', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'Mollie T. Muriel\r' )
  } )

  const opts = {
    label: 'Name: ',
    nolist: true
  }

  nfzf( opts, function ( r ) {
    log( r )
    t.equal( r.query, 'Mollie T. Muriel' )
  } )
} )

test( 'test getInput promise', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'Mollie T. Muriel\r' )
  } )

  let r = await nfzf.getInput( 'Name: ' )
  log( r )

  t.equal( r.query, 'Mollie T. Muriel' )
} )

test( 'test opts.nolist, opts.label promise', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'Mollie T. Muriel\r' )
  } )

  const opts = {
    label: 'Name: ',
    nolist: true
  }

  let r = await nfzf( opts )
  log( r )

  t.equal( r.query, 'Mollie T. Muriel' )
} )

test( 'test prefilled query (-q, --query)', async function ( t ) {
  t.plan( 1 )

  // prepare mocked user input for nfzf
  process.nextTick( function () {
    stdin.send( 'Mollie\r' )
  } )

  const opts = {
    label: 'Name: ',
    query: 'Apa the ',
    nolist: true
  }

  let r = await nfzf( opts )
  log( r )

  t.equal( r.query, 'Apa the Mollie' )
} )

test( 'test selectOne (-1, --select-1) with 1 result', async function ( t ) {
  const opts = {
    list: require( '../test/animals.json' ) ,
    query: 'Gi', // should only match "Giraffe"
    mode: 'normal',
    selectOne: true,
  }
  const timeout = setTimeout(function () {
    t.fail('error: selectOne test timed out')
    process.exit(1)
  }, 100)
  const r = await nfzf( opts )
  clearTimeout(timeout)
  log( r )

  t.equal( r.selected.value, 'Giraffes', 'Giraffes found' )
  t.equal( r.query, 'Gi', 'Gi was prefilled' )
  t.end()
} )

test( 'test selectOne (-1, --select-1) with 2 results', async function ( t ) {
  const opts = {
    list: require( '../test/animals.json' ) ,
    query: 'do', // should match Dogs and Donkeys
    mode: 'normal',
    selectOne: true,
  }
  const timeout = setTimeout(function () {
    t.pass('did not select automatically because more than 1 result')

    process.nextTick( function () {
      // ctrl-j ( \x0A ) // select the second result (donkeys)
      stdin.send( '\x0A\r' )
    } )
  }, 100)
  const r = await nfzf( opts )
  clearTimeout(timeout)
  log( r )

  t.equal( r.selected.value, 'Donkeys', 'Donkeys found' )
  t.equal( r.query, 'do', 'do was prefilled' )
  t.end()
} )

test( 'test selectOne (-1, --select-1) with no query', async function ( t ) {
  const opts = {
    list: require( '../test/animals.json' ) ,
    mode: 'normal',
    selectOne: true,
  }
  const timeout = setTimeout(function () {
    t.pass('did not select automatically because more than 1 result')

    process.nextTick( function () {
      // ctrl-j ( \x0A ) // select the second result (donkeys)
      stdin.send( '\x0A\x0A\r' )
    } )
  }, 100)
  const r = await nfzf( opts )
  clearTimeout(timeout)
  log( r )

  t.equal( r.selected.value, 'Bats', 'Bats found' )
  t.equal( r.query, '', 'no query found' )
  t.end()
} )

test( 'test selectOne (-1, --select-1) with no query but with a list of 1', async function ( t ) {
  const opts = {
    list: require( '../test/animals.json' ).slice(19, 20), // [ Flamingos ]
    mode: 'normal',
    selectOne: true,
  }
  const timeout = setTimeout(function () {
    t.fail('error: selectOne test timed out')
    process.exit(1)
  }, 100)
  const r = await nfzf( opts )
  clearTimeout(timeout)
  log( r )

  t.equal( r.selected.value, 'Flamingos', 'Flamingos found' )
  t.equal( r.query, '', 'no query found' )
  t.end()
} )

test( 'test selectOne (-1, --select-1) -- should not auto select single match after initial load', async function ( t ) {
  t.plan(3)
  const opts = {
    list: require( '../test/animals.json' ),
    mode: 'normal',
    query: 'do',
    selectOne: true,
  }

  process.nextTick( function () {
    // add a 'g' to complete query for "Dog" which should change to match 1
    stdin.send( 'g' )
  } )
  const timeout = setTimeout(function () {
    t.pass('did not automatically select Dog after initial load')
    process.nextTick( function () {
      // ctrl-h ( \x08 ) ( backspace )
      stdin.send( '\x08\x08\x08monk' )

      process.nextTick( function () {
        stdin.send( 'eys\r' )
      } )
    } )
  }, 100)
  const r = await nfzf( opts )
  clearTimeout(timeout)
  log( r )

  t.equal( r.selected.value, 'Monkeys', 'Monkeys found' )
  t.equal( r.query, 'monkeys', 'full query OK' )
} )

// TODO test --keep-right somehow..
// TODO implement and test for --keep-left?
// TODO add support for query or using '|' similar to fzf?
