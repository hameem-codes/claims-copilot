import fs from "fs";
import { PDFDocument } from "pdf-lib";

async function createPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText("This is a test PDF for document ingestion chunking.", { x: 50, y: 700, size: 30 });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("test.pdf", pdfBytes);
  console.log("PDF created");
}
createPDF().catch(console.error);
