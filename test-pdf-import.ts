async function run() {
  const pdfParseModule = await import("pdf-parse");
  console.log("Keys:", Object.keys(pdfParseModule));
  console.log("Type of default:", typeof pdfParseModule.default);
  if (pdfParseModule.default) {
    console.log("Keys of default:", Object.keys(pdfParseModule.default));
    console.log("Type of default.default:", typeof (pdfParseModule.default as any).default);
  }
}
run();
