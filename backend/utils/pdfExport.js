const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#7c4dff',
  primaryDark: '#6735f2',
  text: '#18181d',
  muted: '#62626d',
  border: '#e9e5f3',
  bgLight: '#f6f3ff',
  white: '#ffffff',
  green: '#15803d',
  orange: '#b45309'
};

function generateMedicalRecordPdf(record) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: 'Dossier Medical - Sika Sante',
      Author: 'Sika Sante',
      Subject: `Dossier patient ${record.patient?.cmuNumber || ''}`,
      Creator: 'Sika Sante - Export automatique'
    }
  });

  const pageWidth = doc.page.width - 100;

  // ── Header ──
  doc.rect(50, 50, pageWidth, 70).fill(COLORS.primary);
  doc.fill(COLORS.white).fontSize(22).font('Helvetica-Bold')
    .text('SIKA SANTE', 70, 65, { width: pageWidth - 40 });
  doc.fontSize(10).font('Helvetica')
    .text('Dossier Medical Patient - Export officiel', 70, 92, { width: pageWidth - 40 });
  doc.fill(COLORS.white).fontSize(9).font('Helvetica')
    .text(`Genere le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 70, 106, { width: pageWidth - 40, align: 'right' });

  doc.moveDown(3);

  // ── Identity section ──
  if (record.identity) {
    sectionTitle(doc, 'Identite du patient');
    const identity = record.identity;
    infoRow(doc, 'Nom complet', identity.fullName || 'Non renseigne');
    infoRow(doc, 'Numero CMU', identity.cmuNumber || 'Non renseigne');
    infoRow(doc, 'Telephone', identity.phone || 'Non renseigne');
    infoRow(doc, 'Email', identity.email || 'Non renseigne');
    if (identity.birthDate && identity.birthDate !== 'Non renseignee') {
      infoRow(doc, 'Date de naissance', identity.birthDate);
    }
    if (identity.gender && identity.gender !== 'Non renseigne') {
      infoRow(doc, 'Sexe', identity.gender);
    }
    doc.moveDown(0.8);
  }

  // ── Clinical summary ──
  if (record.clinicalSummary) {
    sectionTitle(doc, 'Resume clinique');
    const cs = record.clinicalSummary;
    infoRow(doc, 'Groupe sanguin', cs.bloodGroup || 'Non renseigne');
    infoRow(doc, 'Allergies connues', (cs.allergies || []).join(', ') || 'Aucune connue');
    infoRow(doc, 'Maladies chroniques', (cs.chronicConditions || []).join(', ') || 'Aucune renseignee');
    infoRow(doc, 'Antecedents importants', (cs.importantHistory || []).join(', ') || 'Non renseignes');
    doc.moveDown(0.8);
  }

  // ── Diagnostic summary ──
  if (record.diagnosticSummary) {
    sectionTitle(doc, 'Synthese diagnostique');
    const ds = record.diagnosticSummary;
    infoRow(doc, 'Derniere consultation', ds.lastConsultationDate || 'Aucune');
    infoRow(doc, 'Dernier diagnostic', ds.latestDiagnosis || 'Aucun');
    infoRow(doc, 'Etat global', ds.currentStatus || record.globalStatus || 'Stable');
    infoRow(doc, 'Professionnel referent', ds.referringProfessional || 'Non renseigne');
    doc.moveDown(0.8);
  }

  // ── Consultations table ──
  if (record.consultations?.length) {
    checkPageBreak(doc, 120);
    sectionTitle(doc, `Historique des consultations (${record.consultations.length})`);

    record.consultations.forEach((c, i) => {
      checkPageBreak(doc, 80);
      const y = doc.y;

      // Card background
      doc.rect(50, y, pageWidth, 60).fill(i % 2 === 0 ? COLORS.bgLight : COLORS.white);

      doc.fill(COLORS.text).fontSize(10).font('Helvetica-Bold')
        .text(`${i + 1}. ${c.title || 'Consultation'}`, 60, y + 8, { width: pageWidth - 160 });

      doc.fill(COLORS.primary).fontSize(8).font('Helvetica')
        .text(formatDateSafe(c.date || c.created_at), pageWidth - 80, y + 8, { width: 120, align: 'right' });

      doc.fill(COLORS.muted).fontSize(9).font('Helvetica')
        .text(`Professionnel : ${c.professionalName || 'Non renseigne'}`, 60, y + 24, { width: pageWidth - 20 });

      doc.fill(COLORS.text).fontSize(9).font('Helvetica')
        .text(`${(c.summary || 'Resume non disponible').substring(0, 150)}`, 60, y + 38, { width: pageWidth - 20 });

      doc.y = y + 65;
    });
  }

  // ── Footer ──
  checkPageBreak(doc, 80);
  doc.moveDown(2);
  const footerY = doc.y;
  doc.rect(50, footerY, pageWidth, 1).fill(COLORS.border);
  doc.moveDown(0.5);
  doc.fill(COLORS.muted).fontSize(8).font('Helvetica')
    .text('Ce document est genere automatiquement par la plateforme Sika Sante.', 50, footerY + 10, { width: pageWidth, align: 'center' });
  doc.text('Il ne constitue pas un avis medical et ne remplace pas une consultation avec un professionnel de sante.', 50, footerY + 22, { width: pageWidth, align: 'center' });
  doc.fill(COLORS.primary).fontSize(8).font('Helvetica-Bold')
    .text('www.sika-sante.ci', 50, footerY + 40, { width: pageWidth, align: 'center' });

  return doc;
}

// ── Helpers ──

function sectionTitle(doc, title) {
  const y = doc.y;
  doc.rect(50, y, 4, 18).fill(COLORS.primary);
  doc.fill(COLORS.text).fontSize(13).font('Helvetica-Bold')
    .text(title, 62, y + 1);
  doc.moveDown(0.6);
  doc.rect(50, doc.y, doc.page.width - 100, 0.5).fill(COLORS.border);
  doc.moveDown(0.4);
}

function infoRow(doc, label, value) {
  const y = doc.y;
  doc.fill(COLORS.muted).fontSize(9).font('Helvetica')
    .text(label, 60, y, { width: 140, continued: false });
  doc.fill(COLORS.text).fontSize(9).font('Helvetica-Bold')
    .text(String(value), 200, y, { width: doc.page.width - 250 });
  doc.y = y + 16;
}

function checkPageBreak(doc, needed) {
  if (doc.y + needed > doc.page.height - 80) {
    doc.addPage();
  }
}

function formatDateSafe(value) {
  if (!value) return 'Date inconnue';
  try {
    return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(value);
  }
}

module.exports = { generateMedicalRecordPdf };
