import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ReportData {
    organizationName: string
    generatedDate: string
    kpiData: {
        totalUsers: number
        completedSurveys: number
        pendingSurveys: number
        completionRate: number
    }
    analyticsData?: {
        kpis: any[]
        benchmarks: any[]
        milestones: any[]
    }
    chartData?: any[]
}

export const generateAnalyticsReport = async (data: ReportData) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    let yPosition = margin

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
            return true
        }
        return false
    }

    // Header with branding
    pdf.setFillColor(15, 23, 42) // slate-900
    pdf.rect(0, 0, pageWidth, 50, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont('helvetica', 'bold')
    pdf.text('HUSU', margin, 25)

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text('ANALYTICS REPORT', margin, 35)

    // Organization name and date on the right
    pdf.setFontSize(9)
    const orgText = data.organizationName
    const dateText = `Generated: ${data.generatedDate}`
    pdf.text(orgText, pageWidth - margin, 25, { align: 'right' })
    pdf.text(dateText, pageWidth - margin, 32, { align: 'right' })

    yPosition = 60

    // Executive Summary Section
    pdf.setTextColor(51, 65, 85) // slate-700
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('EXECUTIVE SUMMARY', margin, yPosition)
    yPosition += 10

    // KPI Cards in a grid
    const cardWidth = (contentWidth - 10) / 2
    const cardHeight = 35
    const cardSpacing = 10

    const kpiCards = [
        {
            label: 'Total Employees',
            value: data.kpiData.totalUsers.toString(),
            color: [37, 99, 235] as [number, number, number], // blue-600
            symbol: 'USERS'
        },
        {
            label: 'Completed Surveys',
            value: data.kpiData.completedSurveys.toString(),
            color: [34, 197, 94] as [number, number, number], // green-500
            symbol: 'DONE'
        },
        {
            label: 'Pending Surveys',
            value: data.kpiData.pendingSurveys.toString(),
            color: [245, 158, 11] as [number, number, number], // amber-500
            symbol: 'WAIT'
        },
        {
            label: 'Completion Rate',
            value: `${data.kpiData.completionRate}%`,
            color: [139, 92, 246] as [number, number, number], // violet-500
            symbol: 'RATE'
        }
    ]

    kpiCards.forEach((card, index) => {
        const row = Math.floor(index / 2)
        const col = index % 2
        const x = margin + (col * (cardWidth + cardSpacing))
        const y = yPosition + (row * (cardHeight + cardSpacing))

        checkPageBreak(cardHeight + cardSpacing)

        // Card background
        pdf.setFillColor(248, 250, 252) // slate-50
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F')

        // Colored accent bar on left
        pdf.setFillColor(...card.color)
        pdf.rect(x, y, 4, cardHeight, 'F')

        // Symbol badge
        pdf.setFillColor(...card.color)
        pdf.roundedRect(x + 10, y + 8, 20, 8, 2, 2, 'F')
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(255, 255, 255)
        pdf.text(card.symbol, x + 20, y + 13, { align: 'center' })

        // Label
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(148, 163, 184) // slate-400
        pdf.text(card.label.toUpperCase(), x + 10, y + 22)

        // Value
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(15, 23, 42) // slate-900
        pdf.text(card.value, x + 10, y + 31)
    })

    yPosition += (Math.ceil(kpiCards.length / 2) * (cardHeight + cardSpacing)) + 15

    // Analytics Data Section (if available)
    if (data.analyticsData && (data.analyticsData.kpis?.length > 0 || data.analyticsData.benchmarks?.length > 0)) {
        checkPageBreak(40)

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85)
        pdf.text('PERFORMANCE SCORECARD', margin, yPosition)
        yPosition += 10

        // KPIs
        if (data.analyticsData.kpis?.length > 0) {
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(37, 99, 235) // blue-600
            pdf.text('Key Performance Indicators', margin, yPosition)
            yPosition += 8

            data.analyticsData.kpis.forEach((kpi) => {
                checkPageBreak(25)

                // KPI Box
                pdf.setFillColor(239, 246, 255) // blue-50
                pdf.roundedRect(margin, yPosition, contentWidth, 20, 2, 2, 'F')

                pdf.setFontSize(10)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(15, 23, 42)
                pdf.text(kpi.title, margin + 5, yPosition + 8)

                pdf.setFontSize(14)
                pdf.setFont('helvetica', 'bold')
                pdf.text(kpi.value || 'N/A', margin + 5, yPosition + 16)

                // Progress bar if percentage exists
                if (kpi.percentage !== undefined) {
                    const barWidth = 50
                    const barX = pageWidth - margin - barWidth - 25
                    const barY = yPosition + 10

                    pdf.setFillColor(226, 232, 240) // slate-200
                    pdf.roundedRect(barX, barY, barWidth, 4, 2, 2, 'F')

                    pdf.setFillColor(37, 99, 235) // blue-600
                    pdf.roundedRect(barX, barY, (barWidth * kpi.percentage) / 100, 4, 2, 2, 'F')

                    pdf.setFontSize(8)
                    pdf.setTextColor(100, 116, 139)
                    pdf.text(`${kpi.percentage}%`, barX + barWidth + 3, barY + 3)
                }

                yPosition += 25
            })

            yPosition += 5
        }

        // Benchmarks
        if (data.analyticsData.benchmarks?.length > 0) {
            checkPageBreak(30)

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(147, 51, 234) // purple-600
            pdf.text('Strategic Benchmarks', margin, yPosition)
            yPosition += 8

            data.analyticsData.benchmarks.forEach((bm) => {
                checkPageBreak(25)

                pdf.setFillColor(250, 245, 255) // purple-50
                pdf.roundedRect(margin, yPosition, contentWidth, 20, 2, 2, 'F')

                pdf.setFontSize(10)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(15, 23, 42)
                pdf.text(bm.title, margin + 5, yPosition + 8)

                pdf.setFontSize(14)
                pdf.setFont('helvetica', 'bold')
                pdf.text(bm.value || 'N/A', margin + 5, yPosition + 16)

                if (bm.percentage !== undefined) {
                    const barWidth = 50
                    const barX = pageWidth - margin - barWidth - 25 // Move 20px more to the left
                    const barY = yPosition + 10

                    pdf.setFillColor(226, 232, 240)
                    pdf.roundedRect(barX, barY, barWidth, 4, 2, 2, 'F')

                    pdf.setFillColor(147, 51, 234) // purple-600
                    pdf.roundedRect(barX, barY, (barWidth * bm.percentage) / 100, 4, 2, 2, 'F')

                    pdf.setFontSize(8)
                    pdf.setTextColor(100, 116, 139)
                    pdf.text(`${bm.percentage}%`, barX + barWidth + 3, barY + 3)
                }

                yPosition += 25
            })

            yPosition += 5
        }

        // Milestones
        if (data.analyticsData.milestones?.length > 0) {
            checkPageBreak(30)

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(34, 197, 94) // green-600
            pdf.text('Success Milestones', margin, yPosition)
            yPosition += 8

            data.analyticsData.milestones.forEach((ms) => {
                checkPageBreak(30)

                // Calculate milestone box height
                let msBoxHeight = 22
                if (ms.achievements && ms.achievements.length > 0) {
                    msBoxHeight += ms.achievements.length * 5 + 3
                }

                pdf.setFillColor(240, 253, 244) // green-50
                pdf.roundedRect(margin, yPosition, contentWidth, msBoxHeight, 2, 2, 'F')

                // Milestone indicator (square badge)
                pdf.setFillColor(34, 197, 94)
                pdf.roundedRect(margin + 5, yPosition + 5, 6, 6, 1, 1, 'F')

                // Title
                pdf.setFontSize(10)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(15, 23, 42)
                pdf.text(ms.title, margin + 15, yPosition + 10)

                // Date and type
                if (ms.date || ms.type) {
                    pdf.setFontSize(7)
                    pdf.setTextColor(100, 116, 139)
                    const dateText = ms.date ? new Date(ms.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) : ''
                    const typeText = ms.type ? `[${ms.type}]` : ''
                    pdf.text(`${dateText} ${typeText}`.trim(), margin + 15, yPosition + 15)
                }

                // Achievements
                if (ms.achievements && ms.achievements.length > 0) {
                    let achievementY = yPosition + 20
                    ms.achievements.forEach((achievement: string) => {
                        pdf.setFontSize(8)
                        pdf.setTextColor(71, 85, 105)
                        // Use bullet point character
                        pdf.text(`- ${achievement}`, margin + 18, achievementY)
                        achievementY += 5
                    })
                }

                yPosition += msBoxHeight + 5
            })
        }
    }

    // Add footer to all pages
    const footerY = pageHeight - 15
    const pageCount = pdf.internal.pages.length - 1

    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Confidential - For Internal Use Only', margin, footerY)
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
    }

    // Save the PDF
    const fileName = `HUSU_Analytics_Report_${data.organizationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
}

/**
 * STRATEGIC MISSION REPORT GENERATOR
 * Handles block-based reports with dynamic layouts
 */
export const generateStrategicReport = async (report: any) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin - 15) {
            pdf.addPage()
            yPosition = margin + 15
            addBranding()
            return true
        }
        return false
    }

    const addBranding = () => {
        // Top Right Green Badge
        const badgeText = (report.header || 'STRATEGIC INTEL').toUpperCase()
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        const badgeWidth = pdf.getTextWidth(badgeText) + 8
        const badgeX = pageWidth - margin - badgeWidth

        // Render Badge
        pdf.setFillColor(34, 197, 94) // green-500
        pdf.roundedRect(badgeX, margin - 12, badgeWidth, 6, 1, 1, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.text(badgeText, badgeX + 4, margin - 8)
    }

    addBranding()

    // Title Section - Premium Intelligence Block
    pdf.setFillColor(15, 23, 42) // slate-900
    pdf.rect(0, yPosition, pageWidth, 45, 'F')

    // Green Accent Bar
    pdf.setFillColor(34, 197, 94)
    pdf.rect(0, yPosition, 2, 45, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(26)
    pdf.setFont('helvetica', 'bold')
    pdf.text(report.title.toUpperCase(), margin, yPosition + 20, { maxWidth: contentWidth })

    // Premium Metadata Footer for Header
    pdf.setFontSize(7)
    pdf.setFont('courier', 'bold')
    pdf.setTextColor(148, 163, 184) // slate-400
    const timeStamp = `MISSION STAMP: ${new Date().toLocaleDateString()} [${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}] // ID: ${Math.random().toString(36).substring(7).toUpperCase()}`
    pdf.text(timeStamp, margin, yPosition + 35)

    pdf.setTextColor(59, 130, 246) // blue-500
    pdf.text('VERIFIED MISSION LOG // HUSU SECURE ARCHIVE', pageWidth - margin, yPosition + 35, { align: 'right' })

    yPosition += 65

    for (const block of report.blocks) {
        switch (block.type) {
            case 'HEADING':
                checkPageBreak(20)
                pdf.setFontSize(18)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(15, 23, 42)
                pdf.text(block.content.toUpperCase(), margin, yPosition)
                yPosition += 12
                pdf.setDrawColor(59, 130, 246)
                pdf.setLineWidth(1)
                pdf.line(margin, yPosition - 2, margin + 20, yPosition - 2)
                yPosition += 10
                break

            case 'SUBHEADING':
                checkPageBreak(15)
                pdf.setFontSize(12)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(59, 130, 246)
                pdf.text(block.content.toUpperCase(), margin, yPosition)
                yPosition += 10
                break

            case 'TEXT':
                const lines = pdf.splitTextToSize(block.content, contentWidth)
                const textHeight = lines.length * 7

                // Handle long text that spans multiple pages
                let currentLines = []
                for (let i = 0; i < lines.length; i++) {
                    currentLines.push(lines[i])
                    if (yPosition + (currentLines.length * 7) > pageHeight - margin - 15) {
                        pdf.setFontSize(11)
                        pdf.setFont('helvetica', 'normal')
                        pdf.setTextColor(71, 85, 105)
                        pdf.text(currentLines.slice(0, -1), margin, yPosition)
                        pdf.addPage()
                        yPosition = margin + 15
                        addBranding()
                        currentLines = [lines[i]]
                    }
                }
                pdf.setFontSize(11)
                pdf.setFont('helvetica', 'normal')
                pdf.setTextColor(71, 85, 105)
                pdf.text(currentLines, margin, yPosition)
                yPosition += (currentLines.length * 7) + 10
                break

            case 'IMAGE':
                if (block.content.startsWith('http') || block.content.startsWith('data:')) {
                    checkPageBreak(80)
                    try {
                        pdf.addImage(block.content, 'JPEG', margin, yPosition, contentWidth, 80, undefined, 'FAST')
                        yPosition += 90
                    } catch (e) {
                        pdf.setFontSize(8)
                        pdf.text('[Dynamic Imagery Not Renderable in PDF]', margin, yPosition)
                        yPosition += 10
                    }
                }
                break

            case 'CHART':
                checkPageBreak(60)
                pdf.setFillColor(248, 250, 252)
                const cValues = block.content.values || []
                const cLabels = block.content.labels || []
                const cType = block.content.chartType || 'horizontal'
                const cColors = [[59, 130, 246], [99, 102, 241], [139, 92, 246], [168, 85, 247], [217, 70, 239]]

                const chartBoxH = cType === 'vertical' || cType === 'line' ? 60 : 45
                pdf.roundedRect(margin, yPosition, contentWidth, chartBoxH, 2, 2, 'F')

                pdf.setFontSize(8)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(15, 23, 42)
                const cTitleStr = (cType).toUpperCase() + ' MISSION DATA ANALYSIS'
                pdf.text(cTitleStr, margin + 5, yPosition + 8)

                if (cType === 'horizontal') {
                    const total = cValues.reduce((a: number, b: number) => a + b, 0) || 1
                    let bX = margin + 5
                    cValues.forEach((v: number, i: number) => {
                        const bW = (v / total) * (contentWidth - 10)
                        const col = cColors[i % cColors.length]
                        pdf.setFillColor(col[0], col[1], col[2])
                        pdf.rect(bX, yPosition + 15, bW, 6, 'F')
                        bX += bW
                    })
                } else if (cType === 'vertical') {
                    const maxV = Math.max(...cValues, 1)
                    const bW = (contentWidth - 20) / cValues.length
                    cValues.forEach((v: number, i: number) => {
                        const bH = (v / maxV) * 25
                        const col = cColors[i % cColors.length]
                        pdf.setFillColor(col[0], col[1], col[2])
                        pdf.rect(margin + 10 + (i * bW), yPosition + 45 - bH, bW - 4, bH, 'F')
                    })
                } else if (cType === 'pie') {
                    const total = cValues.reduce((a: number, b: number) => a + b, 0) || 1
                    let bX = margin + 5
                    cValues.forEach((v: number, i: number) => {
                        const bW = (v / total) * (contentWidth - 10)
                        const col = cColors[i % cColors.length]
                        pdf.setFillColor(col[0], col[1], col[2])
                        pdf.rect(bX, yPosition + 15, bW, 10, 'F')
                        bX += bW
                    })
                } else if (cType === 'line') {
                    const maxV = Math.max(...cValues, 1)
                    const stepX = (contentWidth - 20) / (cValues.length - 1 || 1)
                    pdf.setDrawColor(59, 130, 246)
                    pdf.setLineWidth(0.5)
                    cValues.forEach((v: number, i: number) => {
                        const x = margin + 10 + (i * stepX)
                        const y = yPosition + 45 - (v / maxV) * 25
                        if (i > 0) {
                            const prevX = margin + 10 + ((i - 1) * stepX)
                            const prevY = yPosition + 45 - (cValues[i - 1] / maxV) * 25
                            pdf.line(prevX, prevY, x, y)
                        }
                        const col = cColors[i % cColors.length]
                        pdf.setFillColor(col[0], col[1], col[2])
                        pdf.circle(x, y, 1, 'F')
                    })
                }

                // Unified Legend
                let lX = margin + 5
                pdf.setFontSize(6)
                cValues.forEach((v: number, i: number) => {
                    const col = cColors[i % cColors.length]
                    pdf.setFillColor(col[0], col[1], col[2])
                    pdf.circle(lX + 1, yPosition + chartBoxH - 6, 1, 'F')
                    pdf.setTextColor(100, 116, 139)
                    pdf.text(`${cLabels[i]}: ${v}%`, lX + 4, yPosition + chartBoxH - 5)
                    lX += (contentWidth / cValues.length)
                })

                yPosition += chartBoxH + 10
                break;

            case 'INFOGRAPHIC':
                checkPageBreak(30)
                const infoWidth = (contentWidth - 10) / 3
                for (let i = 0; i < 3; i++) {
                    const ix = margin + (i * (infoWidth + 5))
                    pdf.setFillColor(241, 245, 249)
                    pdf.roundedRect(ix, yPosition, infoWidth, 25, 2, 2, 'F')
                    pdf.setFontSize(12)
                    pdf.setTextColor(37, 99, 235)
                    pdf.text(`0${i + 1}`, ix + 5, yPosition + 8)
                    pdf.setFontSize(7)
                    pdf.setTextColor(15, 23, 42)
                    pdf.text('INSIGHT POINT', ix + 5, yPosition + 14)
                    pdf.setFontSize(6)
                    pdf.setTextColor(100, 116, 139)
                    pdf.text('Strategic point recorded.', ix + 5, yPosition + 20)
                }
                yPosition += 35
                break
        }
    }

    // Footer
    const pageCount = pdf.internal.pages.length - 1
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text(report.footer || '© 2026 HUSU Intelligence Archive', margin, pageHeight - 10)
        pdf.text(`RECORD PAGE ${i} OF ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
    }

    pdf.save(`${report.title.replace(/\s+/g, '_')}.pdf`)
}
