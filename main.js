var ghostscript = require('@jspawn/ghostscript-wasm');

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
}

callMain().then(outputBytes => {
  process.stdout.write(outputBytes);
}).catch(err => {
  process.stderr.write(err + "\n")
});