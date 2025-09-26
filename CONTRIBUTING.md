# How to Contribute

First, thank you for your interest!

Here are some tips that can help you set up your own test environment.

* Pull the code and start your branch somewhere your browser can load.
* Install Node v22 or newer
* You can develop on chrome in two ways:
  1. Run `npm run dev`. This will enable build watching and automatically reload the extension in the temporary browser profile every time you make a change to the source files.
     * This is the preferred and easiest way. For Firefox, use `npm run dev:firefox`
  2. Run `npm run build` and "Load unpacked" extension from the dist folder.
     * Chrome requires that you enable developer mode to load unpacked extensions.
     * Every time you make a change, you will need to reload the unpacked extension.
* Use the console (inspection tools, et al) in your browser to look at the payload. When it looks right, you're ready!

Most/All of the developers hang out on the [Mousehunt Discord](https://discordapp.com/invite/Ya9zEdk) in #community-tools (you have to set a rank to see it).
