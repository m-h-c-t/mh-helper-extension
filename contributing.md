# How to Contribute

First, thank you for your interest!

Here are some tips that can help you set up your own test environment.

* Pull the code and start your branch somewhere your browser can load.  
* Install Node v16 or newer
* Update manifest.json and change the version number (to something higher). This will prevent you from making submissions while you test things.  
* You can develop on chrome in two ways:
  1. Run `npm run dev`. This will enable build watching and automatically reload the extension in the temporary browser profile every time you make a change to the source files.
  2. Run `npm run build:dev` and "Load unpacked" extension from the dist folder while in chrome developer mode. Note that every time you make a change, you will need to reload the unpacked extension.
* Use the console (inspection tools, et al) in your browser to look at the payload. When it looks right, you're ready!

Most/All of the developers hang out on the [Mousehunt Discord](https://discordapp.com/invite/Ya9zEdk) in #community-tools (you have to set a rank to see it).
