# Vendored browser dependencies

## heic2any 0.0.4

- Source: https://github.com/alexcorvi/heic2any
- Distribution: https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js
- SHA-256: `0963cfa50e9e1e7e6af929a40a81e3e898a673f1270eafa6917dd137e4968164`
- License: MIT; see `heic2any-LICENSE.md`

StoriesLens loads this file from its own origin only when a browser cannot decode a selected HEIC/HEIF image natively. Conversion happens in the browser before the image is redrawn without metadata. The original file is never sent to the converter author or a third-party CDN.


## pdf-lib 1.17.1

- Source: https://github.com/Hopding/pdf-lib
- Distribution: local copy of `node_modules/pdf-lib/dist/pdf-lib.min.js`
- SHA-256: `0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f`
- License: MIT; see `pdf-lib-LICENSE.md`

StoriesLens loads this file from its own origin so parents can build an A5 PDF on the device, without Google Fonts or a third-party CDN. The same library is used on the server for tests and as a fallback generator.
