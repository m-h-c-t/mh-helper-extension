# Tsitu's Menu Loader

In MV3, there are stricter requirements for code that is distributed with extensions. We were getting dinged for "external scripts"
even though we replace the URL at runtime. The replacement must be done at compile time.

If this file (bm-menu.min.js) needs updating, get it from here: <https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-menu.min.js>

Replace

`,n="https://cdn.jsdelivr.net/gh/tsitu/MH-Tools@master/src/bookmarklet/bm-"+e+".min.js";t.src=n`

with

`;t.src="EXTENSION_URL/third_party/tsitu/bm-"+e+".min.js"`

Webpack will replace EXTENSION_URL with the WebpackCopyPlugin transform. The DefinePlugin was also tried, but the output is not bookmarklet compatible.
