This utility is designed to remove anything except visible elements of a PDF, neutralizing anything potentially harmful.
It is intended to be run against untrusted PDFs to remove some potential danger.

The untrusted PDF is fed into via `stdin`. 
The resulting PDF is outputted via `stdout` if successful.
If an error occurrs, something will be printed to `stderr`.

Internally, it uses GhostScript, sandboxed in a WASM runtime, to convert the PDF to Postscript format and then back to PDF.

Usage:
```
npm install -g pdf_neutralize
pdf_neutralize < untrusted.pdf > neutralized.pdf

```