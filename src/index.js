const keypress = require( 'keypress' )

const ttys = require( 'ttys' )

const stdin = ttys.stdin
const stdout = ttys.stdout

const clc = require( 'cli-color' )

module.exports = start

function start ( _list, callback )
{
  const api = {}

  api.update = function ( _list ) {
    list = _list.slice()
    render()
  }

  api.stop = stop

  function stop () {
    stdin.removeListener( 'keypress', handleKeypress )

    stdin.setRawMode && stdin.setRawMode( false )
    stdin.pause()
  }

  // make `process.stdin` begin emitting "keypress" events
  keypress( stdin )

  let selectionOffset = 0
  let buffer = ''
  let _printedMatches = 0

  let list = _list || []

  let matches = []
  let selectedItem

  const MIN_HEIGHT = 6

  const debug = false

  function handleKeypress ( chunk, key ) {
    debug && console.log( 'chunk: ' + chunk )

    key = key || { name: '' }

    const name = String( key.name )

    debug && console.log( 'got "keypress"', key )

    if ( key && key.ctrl && name === 'c' ) {
      cleanDirtyScreen()
      return stop()
    }

    if ( key && key.ctrl && name === 'z' ) {
      cleanDirtyScreen()
      return stop()
    }

    if ( key && key.ctrl && name === 'l' ) {
      // return stdout.write( clc.reset )
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

        case 'q': // quit
          cleanDirtyScreen()
          stop()
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
      case 'down':
      case 'enter':
        selectionOffset += 1
        return render()
        break

      case 'up':
        selectionOffset -= 1
        return render()
        break

      case 'esc':
      case 'escape':
        cleanDirtyScreen()
        return stop()
        break

      // hit enter key ( or ctrl-m )
      case 'return':
        cleanDirtyScreen()
        stop()

        if ( callback ) {
          if ( selectedItem ) {
            callback(
              selectedItem.original,
              selectedItem.originalIndex
            )
          } else {
            callback( null )
          }
        }

        return
        break
    }

    if ( chunk && chunk.length === 1 ) {
      if ( key.shift ) {
        buffer += chunk.toUpperCase()
      } else {
        buffer += chunk
      }

      render()
    }
  }

  stdin.setEncoding( 'utf8' )
  stdin.on( 'keypress', handleKeypress )

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
      const originalIndex = i
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
          originalIndex: originalIndex,
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

  function cleanDirtyScreen ()
  {
    const width = clc.windowSize.width
    const writtenHeight = Math.max(
      MIN_HEIGHT,
      2 + _printedMatches
    )

    stdout.write( clc.move( -width ) )

    for ( let i = 0; i < writtenHeight; i++ ) {
      stdout.write( clc.erase.line )
      stdout.write( clc.move.down( 1 ) )
    }

    stdout.write( clc.move.up( writtenHeight ) )
  }

  function render ()
  {
    const width = clc.windowSize.width
    const height = clc.windowSize.height
    // console.log( 'window height: ' + height )
    // !debug && stdout.write( clc.erase.screen )
    // stdout.write( clc.move.to( 0, height ) )

    cleanDirtyScreen()

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
    stdout.write( clcFgBufferArrow( '> ' ) )
    stdout.write( buffer )
    stdout.write( '\n' )

    // print matches
    const n = matches.length
    stdout.write( '  ' )
    stdout.write( clcFgGreen( n + '/' + list.length ) )
    stdout.write( '\n' )

    if ( !selectedItem ) {
      selectedItem = matches[ 0 ]
    }

    _printedMatches = 0

    const maxPrintLength = Math.min( matches.length, MIN_HEIGHT )

    const startIndex = Math.max( 0, offset - maxPrintLength + Math.ceil( MIN_HEIGHT * 0.25 ) )

    const matchLimit = Math.min( maxPrintLength + startIndex, matches.length )

    // print matches
    for ( let i = startIndex; i < matchLimit; i++ ) {
      _printedMatches++

      const match = matches[ i ]

      const item = match.colored

      const itemSelected = (
        ( offset === i )
      )

      if ( itemSelected ) {
        selectedItem = match
        stdout.write( clcBgGray( clcFgArrow( '> ' ) ) )
        stdout.write( clcBgGray( item ) )
        stdout.write( '\n' )
      } else {
        stdout.write( clcBgGray( ' ' ) )
        stdout.write( ' ' )
        stdout.write( item )
        stdout.write( '\n' )
      }
    }

    stdout.write( clc.move.up( 2 + _printedMatches ) )
    stdout.write( clc.move.right( 1 + buffer.length + 1 ) )
  }

  stdin.setRawMode && stdin.setRawMode( true )
  stdin.resume()

  render()

  return api
}
