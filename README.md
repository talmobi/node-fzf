[![npm](https://img.shields.io/npm/v/node-fzf.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/node-fzf)
[![npm](https://img.shields.io/npm/l/node-fzf.svg?maxAge=3600&style=flat-square)](https://github.com/talmobi/node-fzf/blob/master/LICENSE)

#  node-fzf
[fzf](https://github.com/junegunn/fzf) inspired fuzzy CLI list selection 🎀

![](https://thumbs.gfycat.com/DisgustingElderlyIbadanmalimbe-size_restricted.gif)

## Easy to use

#### CLI usage
```bash
npm install -g node-fzf

# by default (TTY mode) will glob list of current dir files
nfzf

# using pipes
find . | grep -v node_modules | nfzf
```

#### API usage
```js
const nfzf = require( 'node-fzf' )

const list = [ 'whale', 'giraffe', 'monkey' ]

// opens interactive selection CLI
// note! this messes with stdout so if you are
// writing to stdout at the same time it will look a bit messy..
const api = nfzf( list, function ( result ) {
  const { selected, query } = result;
  if( !selected ) {
    console.log( 'No matches for:', query )
  } else {
    console.log( selected.value ) // 'giraffe'
    console.log( selected.index ) // 1
    console.log( selected.value === list[ selected.index ] ) // true
  }

} )

// can also add more items later..
setInterval( function () {
  list.push( 'foobar' )
  api.update( list )
}, 1000 )
```

#### Keyboard
```bash
<ctrl-j>,down                 scroll down
<ctrl-k>,up                   scroll up

<ctrl-d>                      scroll down by 10
<ctrl-u>                      scroll up by 10

<esc>,<ctrl-q>,<ctrl-c>       cancel

<return>,<ctrl-m>             trigger callback with current selection and exit

<ctrl-w>                      clear last word (whitespace delimited) from fuzzy search

<backspace>                   delete last fuzzy search character
```

## About
[fzf](https://github.com/junegunn/fzf) inspired fuzzy CLI list selection thing for node.

## Why
easy fuzzy list selection UI for NodeJS CLI programs.

## How
Mostly [cli-color](https://github.com/medikoo/cli-color) for dealing with the terminal rendering
and [ttys](https://github.com/TooTallNate/ttys) to hack the ttys to simultaneously
read from non TTY stdin and read key inputs from TTY stdin -> So that we can get piped input while
also at the same time receive and handle raw keyboard input.

## Used by
[yt-play](https://github.com/talmobi/yt-play)

[yt-search](https://github.com/talmobi/yt-search)

## Alternatives
[fzf](https://github.com/junegunn/fzf) even though it doesn't work in NodeJS directly is all-in-all a better tool than this piece of crap :) Highly recommend~

## Test
No tests..
