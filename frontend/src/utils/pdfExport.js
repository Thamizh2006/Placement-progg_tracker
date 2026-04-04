import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const addHeader = (doc, title, subtitle) => {
  doc.setFillColor(2, 52, 48);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(title, 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 14, 23);
};

const saveTablePdf = ({ title, subtitle, fileName, head, rows }) => {
  const doc = new jsPDF();
  addHeader(doc, title, subtitle);

  autoTable(doc, {
    startY: 36,
    head: [head],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [15, 23, 42],
      cellPadding: 3.2,
    },
    headStyles: {
      fillColor: [0, 237, 100],
      textColor: [8, 19, 15],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: {
      left: 12,
      right: 12,
    },
  });

  doc.save(fileName);
};

export const exportStudentPerformancePdf = ({ rows, scopeLabel }) => {
  saveTablePdf({
    title: 'Student Performance Report',
    subtitle: `Scope: ${scopeLabel} | Generated: ${new Date().toLocaleString()}`,
    fileName: 'student-performance-report.pdf',
    head: ['Student', 'Department', 'Category', 'Progress %', 'Eligible', 'Mentor'],
    rows: rows.map((row) => [
      row.email,
      row.department || '-',
      row.category || '-',
      `${row.progressPercentage || 0}%`,
      row.eligible ? 'Yes' : 'No',
      row.mentor || 'Unassigned',
    ]),
  });
};

export const exportStaffPerformancePdf = ({ rows, scopeLabel }) => {
  saveTablePdf({
    title: 'Staff Performance Report',
    subtitle: `Scope: ${scopeLabel} | Generated: ${new Date().toLocaleString()}`,
    fileName: 'staff-performance-report.pdf',
    head: ['Staff', 'Role', 'Department', 'Assigned Students', 'Eligible Students', 'Readiness %'],
    rows: rows.map((row) => [
      row.email,
      row.role,
      row.department || '-',
      row.assignedStudentsCount || 0,
      row.eligibleStudentsCount || 0,
      `${row.readinessRate || 0}%`,
    ]),
  });
};
