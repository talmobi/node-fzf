const keypress = require( 'keypress' )
const ttys = require( 'ttys' )

const stdin = ttys.stdin
const stdout = ttys.stdout

const stringWidth = require( 'string-width' )

const clc = require( 'cli-color' )

module.exports = start

function start ( list, callback )
{
  const promise = new Promise( function ( resolve, reject ) {
    const _api = {}

    let _list = list || []

    let _input = ''

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

    // index of selection relative to currently matched results
    let selectionOffset = 0

    // input buffer
    let buffer = ''

    // input cursor position ( only horizontal )
    // relative to input buffer
    let cursorPosition = 0

    // number of items printed on screen, usually ~7
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

      const view_height = _printedMatches ? _printedMatches : 10

      if ( key.ctrl ) {
        switch ( name ) {
          case 'h': // backspace
            // ignore
            break

          case 'b': // jump back 1 word
            {
              const slice = buffer.slice( 0, cursorPosition )
              const m = slice.match( /\S+\s*$/ ) // last word
              if ( m && m.index > 0 ) {
                // console.log( m.index )
                cursorPosition = m.index
              } else {
                cursorPosition = 0
              }
            }
            return render()
            break

          case 'j': // down
          case 'n': // down
            selectionOffset += 1
            return render()
            break
          case 'k': // up
          case 'p': // up
            selectionOffset -= 1
            return render()
            break

          case 'l': // right
            // ignore
            break

          case 'f': // jump forward 1 word
            {
              // TODO
            }
            break

          case 'd': // down
            // basically intended as page-down
            selectionOffset += view_height
            return render()
            break

          case 'u': // up
            // basically intended as page-up
            selectionOffset -= view_height
            return render()
            break

          case 'a': // beginning of line
            cursorPosition = 0
            return render()
            break

          case 'e': // end of line
            cursorPosition = buffer.length
            return render()
            break

          case 'w': // clear word
            {
              const a = buffer.slice( 0, cursorPosition )
              const b = buffer.slice( cursorPosition )
              const m = a.match( /\S+\s*$/ ) // last word
              if ( m && m.index > 0 ) {
                // console.log( m.index )
                cursorPosition = m.index
                buffer = a.slice( 0, cursorPosition ).concat( b )
              } else {
                cursorPosition = 0
                buffer = b
              }
            }
            return render()
            break

          case 'q': // quit
            cleanDirtyScreen()
            return stop()
            break
        }
      }

      if ( key.ctrl ) return
      if ( key.meta ) return

      switch ( name ) {
        case 'backspace': // ctrl-h
          {
            const a = buffer.slice( 0, cursorPosition - 1 )
            const b = buffer.slice( cursorPosition )
            buffer = a.concat( b )

            cursorPosition--
            if ( cursorPosition < 0 ) {
              cursorPosition = 0
            }
          }
          return render()
          break

        case 'left': // left arrow key
          cursorPosition--
          if ( cursorPosition < 0 ) cursorPosition = 0
          return render()
          break

        case 'right': // right arrow key
          cursorPosition++
          if ( cursorPosition > buffer.length ) {
            cursorPosition = buffer.length
          }
          return render()
          break

        // text terminals treat ctrl-j as newline ( enter )
        // ref: https://ss64.com/bash/syntax-keyboard.html
        case 'down': // ctrl-j
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

        // hit return key ( aka enter key ) ( aka ctrl-m )
        case 'return': // ctrl-m
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
        let c = ''
        if ( key.shift ) {
          c = chunk.toUpperCase()
        } else {
          c = chunk
        }

        if ( c ) {
          const a = buffer.slice( 0, cursorPosition )
          const b = buffer.slice( cursorPosition )
          buffer = a.concat( c, b )

          cursorPosition++
          if ( cursorPosition > buffer.length ) {
            cursorPosition = buffer.length
          }
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

      // set cursor position to end of buffer
      // stdout.write( clc.move.right( 1 + buffer.length + 1 ) )

      // reset cursor left position
      stdout.write( clc.move( -clc.windowSize.width ) )

      // set cursor left position
      stdout.write( clc.move.right( 2 + cursorPosition ) )
    }

    stdin.setRawMode && stdin.setRawMode( true )
    stdin.resume()

    render()

    return _api
  } )
}

const animals = [
  'Apes',
  'Badgers',
  'Bats',
  'Bears',
  'Bees',
  'Buffalo',
  'Camels',
  'Cats',
  'Cobras',
  'Crocodiles',
  'Crows',
  'Dogs',
  'Donkeys',
  'Eagles',
  'Elephants',
  'Elk',
  'Falcons',
  'Ferrets',
  'Fish',
  'Flamingos',
  'Fox',
  'Frogs',
  'Geese',
  'Giraffes',
  'Gorillas',
  'Hippopotami',
  'Hyenas',
  'Jaguars',
  'Jellyfish',
  'Kangaroos',
  'Lemurs',
  'Leopards',
  'Lions',
  'Moles',
  'Monkeys',
  'Mules',
  'Otters',
  'Oxen',
  'Owls',
  'Parrots',
  'Pigs',
  'Porcupines',
  'Rabbits',
  'Rats',
  'Ravens',
  'Rhinoceroses',
  'Shark',
  'Skunk',
  'Snakes',
  'Squirrels',
  'Stingrays',
  'Swans',
  'Tigers',
  'Toads',
  'Turkeys',
  'Turtles',
  'Weasels',
  'Whales',
  'Wolves',
  'Zebras'
]

start( animals, function ( r ) {
  console.log( r.selected )
} )
