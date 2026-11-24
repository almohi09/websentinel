import { jsPDF } from 'jspdf'

/**
 * Calculates security score and grade based on findings
 */
export function calculatePosture(findings = []) {
  let score = 100
  let critical = 0
  let high = 0
  let medium = 0
  let low = 0
  let info = 0

  findings.forEach((f) => {
    switch (f.severity) {
      case 'CRITICAL':
        score -= 25
        critical++
        break
      case 'HIGH':
        score -= 15
        high++
        break
      case 'MEDIUM':
        score -= 8
        medium++
        break
      case 'LOW':
        score -= 3
        low++
        break
      case 'INFORMATIONAL':
      default:
        info++
        break
    }
  })

  score = Math.max(10, Math.min(100, score))

  let grade = 'A+'
  let verdict = 'EXEMPLARY POSTURE'
  let color = [100, 255, 218] // Cyan

  if (score < 40) {
    grade = 'F'
    verdict = 'CRITICAL RISK - IMMEDIATE ACTION REQUIRED'
    color = [255, 51, 102] // Crimson
  } else if (score < 60) {
    grade = 'D'
    verdict = 'HIGH ATTACK SURFACE EXPOSURE'
    color = [255, 107, 74] // Orange
  } else if (score < 75) {
    grade = 'C'
    verdict = 'MODERATE EXPOSURE - CONFIGURATION DEFICIENCIES'
    color = [245, 158, 11] // Amber
  } else if (score < 90) {
    grade = 'B'
    verdict = 'ACCEPTABLE BASELINE WITH MINOR HARDENING GAPS'
    color = [56, 189, 248] // Sky Blue
  }

  return {
    score,
    grade,
    verdict,
    color,
    counts: { critical, high, medium, low, info, total: findings.length }
  }
}

/**
 * Generates and downloads an Executive Security Assessment PDF Report
 */
export function generateSecurityReportPdf({ scan, website, findings = [] }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const posture = calculatePosture(findings)
  const targetUrl = website?.url || `https://${website?.host || 'target.domain'}`
  const scanDate = scan?.completedAt
    ? new Date(scan.completedAt).toLocaleString()
    : new Date().toLocaleString()

  // Helper to add running header & footer
  const addHeaderAndFooter = (pageNumber, totalPages) => {
    // Header
    doc.setFillColor(10, 25, 47) // #0A192F
    doc.rect(0, 0, pageWidth, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 255, 218) // #64FFDA
    doc.text('WEBSENTINEL // CYBERSECURITY PLATFORM', margin, 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(136, 146, 176) // #8892B0
    doc.text('CONFIDENTIAL ASSESSMENT REPORT', pageWidth - margin, 7.5, { align: 'right' })

    // Footer
    doc.setDrawColor(30, 45, 74) // #1E2D4A
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.setFontSize(7.5)
    doc.setTextColor(136, 146, 176)
    doc.text('WebSentinel Autonomous Attack Surface Defense System', margin, pageHeight - 6)
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
  }

  // Check page overflow helper
  const checkPageBreak = (neededHeight = 25) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage()
      y = 20
      return true
    }
    return false
  }

  // ==================== COVER / EXECUTIVE HEADER ====================
  y = 20

  // Title Banner Box
  doc.setFillColor(17, 34, 64) // #112240
  doc.setDrawColor(30, 45, 74)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD')

  // Shield Icon / Text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('EXECUTIVE SECURITY ASSESSMENT', margin + 6, y + 11)

  doc.setFontSize(9)
  doc.setTextColor(100, 255, 218)
  doc.text('PASSIVE VULNERABILITY AUDIT & ATTACK SURFACE TELEMETRY', margin + 6, y + 17)

  // Scope Metadata Line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(204, 214, 246)
  doc.text(`TARGET HOST: ${targetUrl}`, margin + 6, y + 25)
  doc.text(`SCAN ID: ${scan?.id || 'MANUAL-REF'}`, margin + 6, y + 30)

  doc.text(`AUDIT DATE: ${scanDate}`, margin + 110, y + 25)
  doc.text(`STATUS: ${scan?.status || 'COMPLETED'}`, margin + 110, y + 30)

  y += 42

  // ==================== SCORE & VERDICT SUMMARY ====================
  const scoreCardWidth = 50
  const summaryCardWidth = contentWidth - scoreCardWidth - 4

  // Left: Score Dial Card
  doc.setFillColor(17, 34, 64)
  doc.roundedRect(margin, y, scoreCardWidth, 44, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(136, 146, 176)
  doc.text('POSTURE RATING', margin + 6, y + 8)

  doc.setFontSize(28)
  doc.setTextColor(...posture.color)
  doc.text(`${posture.score}`, margin + 6, y + 24)

  doc.setFontSize(12)
  doc.setTextColor(136, 146, 176)
  doc.text('/ 100', margin + 30, y + 24)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`GRADE: ${posture.grade}`, margin + 6, y + 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(136, 146, 176)
  doc.text('0 - 100 Algorithm Scale', margin + 6, y + 39)

  // Right: Executive Summary & Verdict Card
  const summaryX = margin + scoreCardWidth + 4
  doc.setFillColor(17, 34, 64)
  doc.roundedRect(summaryX, y, summaryCardWidth, 44, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(136, 146, 176)
  doc.text('EXECUTIVE VERDICT & THREAT IMPACT', summaryX + 6, y + 8)

  doc.setFontSize(9)
  doc.setTextColor(...posture.color)
  doc.text(posture.verdict, summaryX + 6, y + 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(204, 214, 246)
  const summaryParagraph = `WebSentinel conducted non-destructive passive reconnaissance against ${targetUrl}. The assessment inspected HTTP armor headers, TLS certificate parameters, cookie cryptographic isolation, and information disclosure indicators. A total of ${posture.counts.total} findings were recorded (${posture.counts.critical} Critical, ${posture.counts.high} High, ${posture.counts.medium} Medium, and ${posture.counts.low} Low).`
  
  const splitSummary = doc.splitTextToSize(summaryParagraph, summaryCardWidth - 12)
  doc.text(splitSummary, summaryX + 6, y + 22)

  y += 50

  // ==================== VULNERABILITY BREAKDOWN TILES ====================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('RISK DISTRIBUTION BREAKDOWN', margin, y)
  y += 4

  const pillWidth = (contentWidth - 8) / 5
  const severityPills = [
    { label: 'CRITICAL', count: posture.counts.critical, color: [255, 51, 102] },
    { label: 'HIGH', count: posture.counts.high, color: [255, 107, 74] },
    { label: 'MEDIUM', count: posture.counts.medium, color: [245, 158, 11] },
    { label: 'LOW', count: posture.counts.low, color: [100, 255, 218] },
    { label: 'INFO', count: posture.counts.info, color: [136, 146, 176] },
  ]

  severityPills.forEach((p, idx) => {
    const px = margin + idx * (pillWidth + 2)
    doc.setFillColor(17, 34, 64)
    doc.setDrawColor(...p.color)
    doc.setLineWidth(0.3)
    doc.roundedRect(px, y, pillWidth, 14, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...p.color)
    doc.text(`${p.count}`, px + 4, y + 6.5)

    doc.setFontSize(6.5)
    doc.setTextColor(136, 146, 176)
    doc.text(p.label, px + 4, y + 11)
  })

  y += 20

  // ==================== DETAILED FINDINGS SECTION ====================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('DETAILED AUDIT FINDINGS & REMEDIATION DOSSIER', margin, y)
  doc.setDrawColor(100, 255, 218)
  doc.setLineWidth(0.4)
  doc.line(margin, y + 2, margin + 40, y + 2)
  y += 8

  if (findings.length === 0) {
    doc.setFillColor(17, 34, 64)
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 255, 218)
    doc.text('No security vulnerabilities detected during this assessment window.', margin + 8, y + 11)
    y += 25
  } else {
    findings.forEach((finding, idx) => {
      // Approximate height needed for this finding box
      const descLines = doc.splitTextToSize(finding.description || 'No description provided.', contentWidth - 14)
      const evidenceLines = finding.evidence ? doc.splitTextToSize(finding.evidence, contentWidth - 18) : []
      const remediationLines = finding.remediation ? doc.splitTextToSize(finding.remediation, contentWidth - 18) : []

      const boxHeight = 22 + (descLines.length * 3.5) +
        (finding.evidence ? (evidenceLines.length * 3.2 + 10) : 0) +
        (finding.remediation ? (remediationLines.length * 3.2 + 10) : 0)

      checkPageBreak(boxHeight + 5)

      // Finding Card Outer Box
      doc.setFillColor(17, 34, 64) // #112240
      doc.setDrawColor(30, 45, 74)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD')

      // Severity Color Strip
      let sevColor = [136, 146, 176]
      if (finding.severity === 'CRITICAL') sevColor = [255, 51, 102]
      else if (finding.severity === 'HIGH') sevColor = [255, 107, 74]
      else if (finding.severity === 'MEDIUM') sevColor = [245, 158, 11]
      else if (finding.severity === 'LOW') sevColor = [100, 255, 218]

      doc.setFillColor(...sevColor)
      doc.rect(margin, y, 3, boxHeight, 'F')

      // Finding Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...sevColor)
      doc.text(`[${finding.severity}]`, margin + 6, y + 6)

      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(finding.title || 'Untitled Finding', margin + 28, y + 6)

      // Finding Status Tag
      doc.setFontSize(7)
      doc.setTextColor(136, 146, 176)
      doc.text(`STATUS: ${finding.status || 'OPEN'}`, pageWidth - margin - 4, y + 6, { align: 'right' })

      let internalY = y + 11

      // Description
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(204, 214, 246)
      doc.text(descLines, margin + 6, internalY)
      internalY += descLines.length * 3.5 + 2

      // Evidence Box (if present)
      if (finding.evidence) {
        const evBoxHeight = evidenceLines.length * 3.2 + 6
        doc.setFillColor(10, 25, 47) // #0A192F
        doc.roundedRect(margin + 6, internalY, contentWidth - 12, evBoxHeight, 1, 1, 'F')

        doc.setFont('courier', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(100, 255, 218)
        doc.text('TECHNICAL EVIDENCE & HEADERS:', margin + 9, internalY + 4)

        doc.setFont('courier', 'normal')
        doc.setTextColor(204, 214, 246)
        doc.text(evidenceLines, margin + 9, internalY + 8)

        internalY += evBoxHeight + 3
      }

      // Remediation Box (if present)
      if (finding.remediation) {
        const remBoxHeight = remediationLines.length * 3.2 + 6
        doc.setFillColor(15, 30, 55)
        doc.roundedRect(margin + 6, internalY, contentWidth - 12, remBoxHeight, 1, 1, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(100, 255, 218)
        doc.text('RECOMMENDED MITIGATION PATCH:', margin + 9, internalY + 4)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(204, 214, 246)
        doc.text(remediationLines, margin + 9, internalY + 8)

        internalY += remBoxHeight + 2
      }

      y += boxHeight + 4
    })
  }

  // ==================== AUDITOR & LEGAL ATTESTATION BLOCK ====================
  checkPageBreak(30)
  doc.setFillColor(10, 25, 47)
  doc.setDrawColor(30, 45, 74)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 255, 218)
  doc.text('ASSESSMENT METHODOLOGY & COMPLIANCE DISCLAIMER', margin + 5, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(136, 146, 176)
  const disclaimer = 'This assessment was conducted using automated non-destructive passive telemetry checks conforming to ethical DevSecOps standards. Findings represent security posture at the specified audit timestamp. WebSentinel assumes no liability for subsequent misconfigurations or attacks. End of report.'
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth - 10)
  doc.text(splitDisclaimer, margin + 5, y + 10.5)

  // Add Headers & Footers to all pages
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addHeaderAndFooter(i, totalPages)
  }

  // Download filename
  const cleanHost = (website?.host || 'target-domain').replace(/[^a-zA-Z0-9.-]/g, '_')
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `WebSentinel_Security_Audit_${cleanHost}_${dateStr}.pdf`

  doc.save(filename)
  return filename
}
