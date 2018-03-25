const keypress = require( 'keypress' )

const clc = require( 'cli-color' )
const glob = require( 'redstar' )

const argv = require( 'minimist' )( process.argv.slice( 2 ) )

// make `process.stdin` begin emitting "keypress" events
keypress( process.stdin )

let selectionOffset = 0
let buffer = ''
let list = []

let matches = []
let selectedItem

const MIN_HEIGHT = 6

if ( ! argv._.length ) {
  glob( '**', function ( err, files, dirs ) {
    if ( err ) throw err

    list = list.concat( files )

    render()
  } )
}

const debug = false

process.stdin.setEncoding( 'utf8' )
process.stdin.on( 'keypress', function ( chunk, key ) {
  debug && console.log( 'chunk: ' + chunk )

  key = key || { name: '' }

  const name = String( key.name )

  debug && console.log( 'got "keypress"', key )

  if ( key && key.ctrl && name === 'c' ) {
    return process.stdin.pause()
  }

  if ( key && key.ctrl && name === 'l' ) {
    return process.stdout.write( clc.reset )
  }

  if ( key.ctrl ) {
    switch ( name ) {
      case 'h': // left
        // ignore
        break
      case 'j': // down
        selectionOffset += 1
        return render()
        break
      case 'k': // up
        selectionOffset -= 1
        return render()
        break
      case 'l': // right
        // ignore
        break

      case 'w': // clear fuzzy word
        buffer = ''
        render()
        break
    }
  }

  if ( key.ctrl ) return
  if ( key.meta ) return

  switch ( name ) {
    case 'backspace':
      buffer = buffer.slice( 0, -1 )
      return render()
      break

    // text terminals treat ctrl-j as newline ( enter )
    // ref: https://ss64.com/bash/syntax-keyboard.html
    case 'enter':
      selectionOffset += 1
      return render()
      break

    // hit enter key ( or ctrl-m )
    case 'return':
      for ( let i = 0; i < MIN_HEIGHT; i++ ) {
        process.stdout.write( clc.erase.line )
        process.stdout.write( clc.move.down( 1 ) )
      }
      process.stdout.write( clc.move.up( MIN_HEIGHT ) )

      console.log( selectedItem )
      process.exit()
      break
      // TODO select item
  }

  if ( chunk && chunk.length === 1 ) {
    if ( key.shift ) {
      buffer += chunk.toUpperCase()
    } else {
      buffer += chunk
    }

    render()
  }
} )

const clcBgGray = clc.bgXterm( 236 )
const clcFgArrow = clc.xterm( 198 )
const clcFgBufferArrow = clc.xterm( 110 )
const clcFgGreen = clc.xterm( 143 )
// const clcFgMatchGreen = clc.xterm( 151 )
const clcFgMatchGreen = clc.xterm( 107 )

function fuzzyMatch ( fuzz, text )
{
  const matches = fuzzyMatches( fuzz, text )
  return matches.length === fuzz.length
}

function fuzzyMatches ( fuzz, text )
{
  fuzz = fuzz.toLowerCase()
  text = text.toLowerCase()

  let tp = 0 // text position/pointer
  let matches = []

  for ( let i = 0; i < fuzz.length; i++ ) {
    const f = fuzz[ i ]

    for ( ; tp < text.length; tp++ ) {
      const t = text[ tp ]
      if ( f === t ) {
        matches.push( tp )
        tp++
        break
      }
    }
  }

  return matches
}

function fuzzyList ( fuzz, list )
{
  const results = []

  for ( let i = 0; i < list.length; i++ ) {
    const item = list[ i ]
    const matches = fuzzyMatches( fuzz, item )

    if ( matches.length === fuzz.length ) {
      // matches
      let t = item

      for ( let i = 0; i < matches.length; i++ ) {
        const index = matches[ matches.length - ( i + 1 ) ]

        const c = clcFgMatchGreen( t[ index ] )
        t = t.slice( 0, index ) + c + t.slice( index + 1 )
      }

      results.push( {
        original: item,
        colored: t
      } )
    }
  }

  // sorts in-place
  results.sort( function ( a, b ) {
    if ( a.original < b.original ) return -1
    return 1
  } )

  return results
}

function render ()
{
  const width = clc.windowSize.width
  const height = clc.windowSize.height
  // console.log( 'window height: ' + height )
  // !debug && process.stdout.write( clc.erase.screen )
  // process.stdout.write( clc.move.to( 0, height ) )

  const writtenHeight = Math.max(
    MIN_HEIGHT,
    2 + matches.length
  )

  process.stdout.write( clc.move( -width ) )

  for ( let i = 0; i < writtenHeight; i++ ) {
    process.stdout.write( clc.erase.line )
    process.stdout.write( clc.move.down( 1 ) )
  }
  process.stdout.write( clc.move.up( writtenHeight ) )

  // calculate matches
  matches = fuzzyList( buffer, list )
  let offset = selectionOffset

  if ( offset >= matches.length ) {
    offset = matches.length - 1
  }

  if ( offset < 0 ) {
    offset = 0
  }

  // save the normalized offset
  selectionOffset = offset

  // print buffer arrow
  process.stdout.write( clcFgBufferArrow( '> ' ) )
  process.stdout.write( buffer )
  process.stdout.write( '\n' )

  // print matches
  const n = matches.length
  process.stdout.write( '  ' )
  process.stdout.write( clcFgGreen( n + '/' + list.length ) )
  process.stdout.write( '\n' )

  // print matches
  for ( let i = 0; i < matches.length ; i++ ) {
    const match = matches[ i ]

    const item = match.colored

    const itemSelected = (
      ( offset === i )
    )

    if ( itemSelected ) {
      selectedItem = match.original
      process.stdout.write( clcBgGray( clcFgArrow( '> ' ) ) )
      process.stdout.write( clcBgGray( item ) )
      process.stdout.write( '\n' )
    } else {
      process.stdout.write( clcBgGray( ' ' ) )
      process.stdout.write( ' ' )
      process.stdout.write( item )
      process.stdout.write( '\n' )
    }
  }

  process.stdout.write( clc.move.up( 2 + matches.length ) )
  process.stdout.write( clc.move.right( 1 + buffer.length + 1 ) )
}

process.stdin.setRawMode( true )
process.stdin.resume()
