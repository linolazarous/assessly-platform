import { jsPDF } from "jspdf";

function PdfReport({ assessment, answers }) {
  const generatePdf = () => {
    const doc = new jsPDF();
    doc.text(`Assessment: ${assessment.title}`, 10, 10);
    assessment.questions.forEach((q, i) => {
      doc.text(`Q${i + 1}: ${q.text}`, 10, 20 + (i * 10));
      doc.text(`Answer: ${answers[i] || "N/A"}`, 10, 25 + (i * 10));
    });
    doc.save("assessment_report.pdf");
  };

  return <button onClick={generatePdf}>Download PDF Report</button>;
}

// Enhanced PDF generation with styling
const generatePdf = () => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text(assessment.title, 105, 20, { align: 'center' });
  
  // Questions
  doc.setFontSize(12);
  let yPosition = 40;
  assessment.questions.forEach((q, i) => {
    doc.text(`Q${i+1}: ${q.text}`, 15, yPosition);
    doc.text(`Answer: ${answers[i] || 'N/A'}`, 15, yPosition + 7);
    yPosition += 20;
    
    // Page break
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  doc.save(`${assessment.title}_report.pdf`);
};