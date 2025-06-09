import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPDF(elementId, filename = "report.pdf") {
  const element = document.getElementById(elementId);
  if (!element) return alert("Element not found");

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
