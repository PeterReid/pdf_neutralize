var ghostscript = require('@jspawn/ghostscript-wasm');

if (process.argv[2] == '--help') {
  console.log("pdf_neutralize reduces the risk of untrusted PDF documents by reducing them to only printable elements.");
  console.log("Internally, the PDF is converted to PS2 and then back to PDF using GhostScript running in a WASM sandbox.");
  console.log("The untrusted input PDF should be written to stdin.");
  console.log("The neutralized output PDF will be written to stdout, if successful.")
  console.log("Errors may be written to stderr.")
  
  console.log("");
  console.log("Usage: pdf_neutralize [output format] < input.pdf > output.pdf");
  console.log("  where [output format] is pdf, jpg, jpg/b64 or omitted")
  return;
}

var mode = process.argv[2] || 'pdf';

function drainStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}

async function callMain() {
  let inputPdf = await drainStream(process.stdin);

  const ghostscriptModule = await ghostscript();

  ghostscriptModule.FS.writeFile('/input.pdf', inputPdf);
  if (mode == 'jpeg' || mode == 'jpeg/b64') {
    var retCode = await ghostscriptModule.callMain([
      "-q",
      "-sstdout=%stderr",
      "-dSAFER", 
      "-dBATCH", 
      "-dNOPAUSE", 
      "-dNOPROMPT",
      "-sDEVICE=jpeg", 
      "-r144", 
      "-sOutputFile=output.jpg", 
      "/input.pdf"])
    if (retCode) throw "Converting to JPEG failed.";
    var retBuffer = ghostscriptModule.FS.readFile('/output.jpg', {encoding: 'binary'});
    return mode == 'jpeg/b64' ? Buffer.from(retBuffer).toString('base64') : retBuffer;
  } else if (mode == 'pdf') {
    var retCode = await ghostscriptModule.callMain([
      "-q",
      "-sstdout=%stderr",
      "-dBATCH", 
      "-dSAFER",
      "-DNOPAUSE",
      "-dNOPROMPT",
      "-sDEVICE=ps2write",
      "-sOutputFile=output.ps",
      "-f", "/input.pdf"
    ]);
    if (retCode) throw "Reading pdf failed.";
    
    var retCode = await ghostscriptModule.callMain([
      "-q",
      "-sstdout=%stderr",
      "-dBATCH", 
      "-dSAFER",
      "-DNOPAUSE",
      "-dNOPROMPT",
      "-sDEVICE=pdfwrite",
      "-sOutputFile=output.pdf",
      "-f", "/output.ps"
    ]);
    if (retCode) throw "Re-writing PDF failed.";
    
    var retBuffer = ghostscriptModule.FS.readFile('/output.pdf', {encoding: 'binary'});
    
    return retBuffer;
  } else {
    throw "Invalid format."
  }
}

callMain().then(outputBytes => {
  process.stdout.write(outputBytes);
}).catch(err => {
  process.stderr.write(err + "\n")
  process.exit(1);
});