import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { School, Teacher, ClassRoom, Student, DailyAttendance, Exam, MarkRecord } from '../types';

export function exportDailyAttendancePDF(
  school: Partial<School>,
  teacher: Partial<Teacher>,
  activeClass: Partial<ClassRoom>,
  dateStr: string,
  absentStudents: Student[],
  totalStudentsCount: number,
  presentCount: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const schoolName = school.schoolName || 'St. Sebastian\'s Higher Secondary School';
  const schoolCode = school.schoolCode || 'FC';
  const teacherName = teacher.name || 'Elwin George';
  const className = activeClass ? `${activeClass.standard || ''} ${activeClass.stream || ''} ${activeClass.section || ''}`.trim() || 'G G A' : 'G G A';
  const academicYear = activeClass.academicYear || teacher.academicYear || '2025-2026';
  const absentCount = absentStudents.length;
  const attendancePercent = totalStudentsCount > 0 ? ((presentCount / totalStudentsCount) * 100).toFixed(1) : '0.0';

  // Header Banner
  doc.setFillColor(88, 28, 135); // Dark Purple #581c87
  doc.rect(0, 0, 210, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName.toUpperCase(), 105, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`School Code: ${schoolCode}`, 105, 17, { align: 'center' });

  // Sub-header details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLASS: ${className}`, 14, 30);
  doc.text(`ACADEMIC YEAR: ${academicYear}`, 105, 30, { align: 'center' });
  doc.text(`TEACHER: ${teacherName}`, 196, 30, { align: 'right' });

  // Report Title Box
  doc.setFillColor(147, 51, 234); // Purple #9333ea
  doc.rect(14, 34, 182, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY ATTENDANCE & ABSENTEE REPORT', 105, 41, { align: 'center' });

  // Date and Totals Pill Bar
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${dateStr}   |   Total Enrolled: ${totalStudentsCount}`, 105, 49, { align: 'center' });

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 52, 182, 10, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Students: ${totalStudentsCount}   |   Present: ${presentCount}   |   Absent: ${absentCount}   |   Attendance: ${attendancePercent}%`, 105, 58.5, { align: 'center' });

  // Section Header: Absent Students List
  doc.setTextColor(225, 29, 72); // Rose
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`ABSENT STUDENTS LIST (${absentCount})`, 14, 69);

  // Table Data
  const tableRows = absentStudents.length > 0 
    ? absentStudents.map((st, idx) => [
        idx + 1,
        st.rollNumber,
        st.fullName,
        st.parentName || st.studentPhone || 'N/A',
        'Absent'
      ])
    : [[ '-', '-', 'All Students Present! No Absentees Recorded.', '-', '-' ]];

  autoTable(doc, {
    startY: 72,
    head: [['Sl No', 'Roll No', 'Student Name', 'Parent / Guardian', 'Attendance Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 20 },
      2: { fontStyle: 'bold', cellWidth: 65 },
      3: { cellWidth: 50 },
      4: { halign: 'center', textColor: [225, 29, 72], fontStyle: 'bold', cellWidth: 32 }
    }
  });

  // Footer Signatures
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  const sigY = Math.max(finalY + 30, 230);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 65, sigY);
  doc.line(145, sigY, 196, sigY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Class Teacher (${teacherName})`, 40, sigY + 5, { align: 'center' });
  doc.text(`Principal (${school.principalName || 'Principal'})`, 170, sigY + 5, { align: 'center' });

  // System Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const now = new Date().toLocaleString();
  doc.text(`HSS ALL IN ONE - Generated on ${now}`, 14, 285);
  doc.text('Page 1 of 1', 196, 285, { align: 'right' });

  doc.save(`Attendance_Report_${className.replace(/\s+/g, '_')}_${dateStr}.pdf`);
}

export function exportExamReportPDF(
  school: Partial<School>,
  activeClass: Partial<ClassRoom>,
  exam: Exam,
  students: Student[],
  marks: MarkRecord[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const schoolName = school.schoolName || 'Higher Secondary School';
  const className = activeClass ? `${activeClass.standard || ''} ${activeClass.section || ''}`.trim() : 'Class Roster';

  // Header Banner
  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName.toUpperCase(), 148.5, 11, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`TABULATION & EXAMINATION MARKS SHEET - ${exam.examName.toUpperCase()} (${exam.examType})`, 148.5, 18, { align: 'center' });

  // Sub headers
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLASS: ${className}`, 14, 31);
  doc.text(`EXAM DATE: ${exam.examDate}`, 148.5, 31, { align: 'center' });
  doc.text(`TOTAL SUBJECTS: ${exam.subjects.length}`, 283, 31, { align: 'right' });

  // Table Columns
  const headers = ['Roll', 'Student Name', ...exam.subjects.map(s => `${s.name}\n(Max ${s.maxMarks})`), 'Total', '%', 'Grade', 'Rank'];
  
  const rows = students.map(st => {
    const markRec = marks.find(m => m.studentId === st.id);
    const subValues = exam.subjects.map(s => {
      const val = markRec?.subjectMarks?.[s.name];
      return val === undefined ? '-' : val === 'AB' ? 'AB' : val;
    });
    return [
      st.rollNumber,
      st.fullName,
      ...subValues,
      markRec ? `${markRec.totalMarks}/${markRec.maxTotalMarks}` : '-',
      markRec ? `${markRec.percentage.toFixed(1)}%` : '-',
      markRec ? markRec.grade : '-',
      markRec ? `#${markRec.rank}` : '-'
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { fontStyle: 'bold', cellWidth: 45 }
    }
  });

  const now = new Date().toLocaleString();
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`HSS ALL IN ONE - Generated on ${now}`, 14, 200);

  doc.save(`Exam_Report_${exam.examName.replace(/\s+/g, '_')}.pdf`);
}

export function exportInstitutionalAuditPDF(
  school: Partial<School>,
  teachers: Teacher[],
  studentsCount: number,
  classesCount: number,
  avgAttendance: number
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Government Banner (Kerala Education Dept style seen in video 01:35)
  doc.setFillColor(15, 23, 42); // Obsidian
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GOVERNMENT OF KERALA • GENERAL EDUCATION DEPARTMENT', 105, 10, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(school.schoolName || 'St. Sebastian\'s Higher Secondary School Koodaranhi', 105, 18, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`School Code: ${school.schoolCode || 'SSHS0111213'} • Consolidated Institutional Progress & Activity Audit`, 105, 25, { align: 'center' });

  // Metric Boxes
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 42, 16, 2, 2, 'FD');
  doc.roundedRect(60, 42, 42, 16, 2, 2, 'FD');
  doc.roundedRect(106, 42, 42, 16, 2, 2, 'FD');
  doc.roundedRect(152, 42, 44, 16, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TEACHERS', 35, 47, { align: 'center' });
  doc.text('CLASSES', 81, 47, { align: 'center' });
  doc.text('STUDENTS', 127, 47, { align: 'center' });
  doc.text('AVG ATTENDANCE', 174, 47, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${teachers.length}`, 35, 54, { align: 'center' });
  doc.text(`${classesCount}`, 81, 54, { align: 'center' });
  doc.text(`${studentsCount}`, 127, 54, { align: 'center' });
  doc.setTextColor(16, 185, 129);
  doc.text(`${avgAttendance.toFixed(1)}%`, 174, 54, { align: 'center' });

  // Section: Associated Teachers & Classes
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSOCIATED TEACHERS & ASSIGNED CLASSES', 14, 68);

  const teacherRows = teachers.length > 0 
    ? teachers.map(t => [
        t.name,
        t.designation || 'HSST Teacher',
        `${t.standard || ''} ${t.stream || ''} ${t.section || ''}`.trim() || 'Assigned',
        t.dob || 'N/A',
        t.phone || 'N/A'
      ])
    : [[ 'No teachers registered yet', '-', '-', '-', '-' ]];

  autoTable(doc, {
    startY: 71,
    head: [['Teacher Name', 'Designation', 'Assigned Class', 'Date of Birth', 'Phone']],
    body: teacherRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date of Report: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, finalY + 15);
  doc.text(`Principal: ${school.principalName || 'Principal & School Head'}`, 196, finalY + 15, { align: 'right' });

  doc.save(`Institutional_Audit_Report_${school.schoolCode || 'School'}.pdf`);
}
