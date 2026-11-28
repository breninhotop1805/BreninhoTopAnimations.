#!/bin/bash
# assemble src/shots.js from the head + helpers borrowed from the Springtrap project + per-part shot files
cd "$(dirname "$0")"
A=../fnaf_always/src/shots.js
{ grep -h "^function glitchIn\|^function twitch" $A; sed -n '152,154p;156,159p' $A; } > /tmp/_extra.js
cat src/shots_head.js /tmp/_extra.js src/shots_p*.js src/shots_tail.js > src/shots.js
