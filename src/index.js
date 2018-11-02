const keypress = require( 'keypress' )

const ttys = require( 'ttys' )

const stdin = ttys.stdin
const stdout = ttys.stdout

const stringWidth = require( 'string-width' )

const clc = require( 'cli-color' )

module.exports = start

function start ( list, callback )
{
  const _api = {}

  let _list = list || []

  _api.update = function ( list ) {
    _list = list.slice()
    render()
  }

  _api.stop = stop

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

  let _matches = []
  let _selectedItem

  const MIN_HEIGHT = 6

  function getMaxWidth () {
    return clc.windowSize.width - 7
  }

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

        case 'd': // down
          selectionOffset += 10
          return render()
          break
        case 'u': // up
          selectionOffset -= 10
          return render()
          break

        case 'w': // clear fuzzy word
          var m = buffer.match( /\s\S+\s*$/ ) // match last whitespace
          if ( m && m.index ) {
            buffer = buffer.slice( 0, m.index + 1 )
          } else {
            buffer = ''
          }
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

      // hit return key ( casually also known as enter key )  ( or ctrl-m )
      case 'return':
        cleanDirtyScreen()
        stop()

        function transformResult ( match ) {
          // match object format
          // results.push( {
          //   originalIndex: originalIndex,
          //   matchedIndex: results.length,
          //   original: item,
          //   text: t // what shows up on terminal/screen
          // } )

          return {
            value: match.original,
            index: match.originalIndex,
            // matchedIndex: match.matchedIndex,
            // toString: function () {
            //   return match.original
            // }
          }
        }

        const result = {
          selected: _selectedItem && transformResult( _selectedItem ) || undefined,
          // matches: _matches.map( transformResult ),
          // list: _list.slice(),
          query: buffer
        }

        if ( callback ) {
          callback( result )
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
      const normalizedItem = item.split( /\s+/ ).join( ' ' )
      const matches = fuzzyMatches( fuzz, normalizedItem )

      if ( matches.length === fuzz.length ) {
        // matches
        let t = normalizedItem

        const paintBucket = [] // characters to colorize at the end

        for ( let i = 0; i < matches.length; i++ ) {
          const index = matches[ i ]
          paintBucket.push( { index: index, clc: clcFgMatchGreen } )
        }

        let len = stringWidth( t ) // use string-width to keep length in check
        const maxLen = getMaxWidth() // terminal width

        // shift left until the last matched fuzzy character is visible
        const lastMatchIndex = matches[ matches.length - 1 ]
        const marginRight = Math.ceil( clc.windowSize.width * 0.4 )

        let matchMarginRight = ( lastMatchIndex + marginRight )
        // limit too much unnecessary empty margin
        if ( matchMarginRight > ( len + 8 ) ) matchMarginRight = ( len + 8 )

        const shiftRight = ( maxLen - matchMarginRight )
        let shiftAmount = 0
        let startIndex = 0
        let endIndex = len

        if ( shiftRight < 0 ) {
          // we need to shift so that the matched text and margin is in view
          shiftAmount = -shiftRight
          t = '...' + t.slice( shiftAmount )

          startIndex = 3
        }

        len = stringWidth( t )
        if ( len > maxLen ) {
          t = t.slice( 0, maxLen ) + '...'
          endIndex = maxLen
        }

        // colorise fuzzy matched characters
        // in reverse because invisible ANSI color characters increases
        // string length
        paintBucket.sort( function ( a, b ) {
          return b.index - a.index
        } )
        for ( let i = 0; i < paintBucket.length; i++ ) {
          const paint = paintBucket[ i ]
          const index = paint.index - shiftAmount + startIndex

          // skip fuzzy chars that have shifted out of view
          if ( index < startIndex ) continue
          if ( index > endIndex ) continue

          const c = paint.clc( t[ index ] )
          t = t.slice( 0, index ) + c + t.slice( index + 1 )
        }

        results.push( {
          originalIndex: originalIndex,
          matchedIndex: results.length,
          original: item,
          text: t // what shows up on terminal/screen
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
    _matches = fuzzyList( buffer, _list )
    let offset = selectionOffset

    if ( offset >= _matches.length ) {
      offset = _matches.length - 1
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
    const n = _matches.length
    stdout.write( '  ' )
    stdout.write( clcFgGreen( n + '/' + _list.length ) )
    stdout.write( '\n' )

    // select first item in list by default ( empty fuzzy search matches first
    // item.. )
    if ( !_selectedItem ) {
      _selectedItem = _matches[ 0 ]
    }

    _printedMatches = 0

    const maxPrintLength = Math.min( _matches.length, MIN_HEIGHT )

    let paddingBottom = 2 // 1 extra padding at the bottom when scrolling down
    if ( _matches.length <= MIN_HEIGHT ) {
      // no extra padding at the bottom since there is no room for it
      // - othewise first match is cut off and will not be visible
      paddingBottom = 1
    }

    const startIndex = Math.max( 0, offset - maxPrintLength + paddingBottom )

    const matchLimit = Math.min( maxPrintLength + startIndex, _matches.length )

    // print matches
    for ( let i = startIndex; i < matchLimit; i++ ) {
      _printedMatches++

      const match = _matches[ i ]

      const item = match.text

      const itemSelected = (
        ( offset === i )
      )

      if ( itemSelected ) {
        _selectedItem = match
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

    if ( _printedMatches < 1 ) {
      // clear selected item when othing matches
      _selectedItem = undefined
    }

    stdout.write( clc.move.up( 2 + _printedMatches ) )
    stdout.write( clc.move.right( 1 + buffer.length + 1 ) )
  }

  stdin.setRawMode && stdin.setRawMode( true )
  stdin.resume()

  render()

  return _api
}
