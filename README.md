This utility is designed to remove anything except visible elements of a PDF, neutralizing anything potentially harmful.
It is intended to be run against untrusted PDFs to remove some potential danger.

Internally, it uses GhostScript, sandboxed in a WASM runtime, to convert the PDF to Postscript format and then back to PDF.