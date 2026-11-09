import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group

def draw_architecture_diagram():
    # Width = 520, Height = 175
    d = Drawing(520, 175)
    
    # Background card
    d.add(Rect(0, 0, 520, 175, fillColor=colors.HexColor('#f8fafc'), strokeColor=colors.HexColor('#cbd5e1'), strokeWidth=1, rx=8, ry=8))
    
    # Layer 1: Client Layer
    d.add(Rect(15, 120, 150, 42, fillColor=colors.HexColor('#0f172a'), strokeColor=None, rx=5, ry=5))
    d.add(String(90, 144, "Merchandiser Dashboard", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.white))
    d.add(String(90, 131, "Next.js 15 SSR / Recharts", textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor('#94a3b8')))
    
    d.add(Rect(185, 120, 150, 42, fillColor=colors.HexColor('#1e293b'), strokeColor=None, rx=5, ry=5))
    d.add(String(260, 144, "Supervisor Mobile Floor", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.white))
    d.add(String(260, 131, "Bilingual / Offline Dexie", textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor('#94a3b8')))
    
    d.add(Rect(355, 120, 150, 42, fillColor=colors.HexColor('#334155'), strokeColor=None, rx=5, ry=5))
    d.add(String(430, 144, "Read-Only Buyer Portal", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.white))
    d.add(String(430, 131, "Tenant RBAC Isolated", textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor('#94a3b8')))
    
    # Connecting Arrows Layer 1 -> Layer 2
    for x in [90, 260, 430]:
        d.add(Line(x, 120, x, 98, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))
        d.add(Line(x, 98, x-3, 102, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))
        d.add(Line(x, 98, x+3, 102, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))

    # Layer 2: API & Logic Layer
    d.add(Rect(15, 60, 490, 38, fillColor=colors.HexColor('#e2e8f0'), strokeColor=colors.HexColor('#94a3b8'), strokeWidth=1, rx=5, ry=5))
    d.add(String(260, 81, "Application API & Core Logic Engine (Next.js App Router API)", textAnchor="middle", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor('#0f172a')))
    d.add(String(260, 68, "Run-Rate Math Engine  |  Tamil AI Voice/Text Pipeline  |  Audit Log Middleware", textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor('#475569')))

    # Connecting Arrows Layer 2 -> Layer 3
    d.add(Line(260, 60, 260, 42, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))
    d.add(Line(260, 42, 257, 46, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))
    d.add(Line(260, 42, 263, 46, strokeColor=colors.HexColor('#64748b'), strokeWidth=1.5))

    # Layer 3: Persistence Layer
    d.add(Rect(15, 10, 490, 32, fillColor=colors.HexColor('#0284c7'), strokeColor=None, rx=5, ry=5))
    d.add(String(260, 28, "Data Persistence Layer (Prisma ORM 7 + LibSQL Driver)", textAnchor="middle", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.white))
    d.add(String(260, 16, "SQLite Database (Orders, TNA Milestones, Daily Updates, AI Categorization, Immutable Compliance Audit)", textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor('#e0f2fe')))

    return d

def generate_pdf():
    pdf_path = "Technical_Design_Document.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=3
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    tbl_head = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)
    tbl_cell = ParagraphStyle('TC', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#1e293b'))
    tbl_bold = ParagraphStyle('TB', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor('#0f172a'))

    story = []

    # Title & Metadata Header
    story.append(Paragraph("Technical Design Document (TDD)", title_style))
    story.append(Paragraph("<b>Project:</b> ThreadFlow (Production Order Tracking & Early Delay Warning SaaS)<br/>"
                           "<b>Client:</b> Company A, Tiruppur &bull; <b>GitHub:</b> https://github.com/thanishmamilla/knitwear<br/>"
                           "<b>Live Demo:</b> https://knitwear-git-main-mamilla-thanish-kumars-projects.vercel.app/", meta_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=0, spaceAfter=8))

    # 1. Executive Summary & Problem Formulation
    story.append(Paragraph("1. Executive Summary & Financial Problem Formulation", h1_style))
    story.append(Paragraph(
        "Company A is a ₹95–110 crore Tiruppur-based knitwear exporter to UK and EU buyers with 3 owned manufacturing units plus subcontracted printing and washing (900 workers, 35 office staff). Currently, merchandisers track ~500 orders/year across multiple spreadsheets by phoning floor supervisors daily.<br/>"
        "&bull; <b>Financial Problem:</b> 8% (40 orders) ship late. 15 require air freight penalties (₹52.5 lakh), 25 suffer 5% buyer discounts (₹26.25 lakh), and 12 merchandisers waste 2 hours/day chasing status (7,200 hrs/yr &times; ₹400 = ₹28.8 lakh). <b>Total annual loss: ₹1.08 Crore.</b><br/>"
        "&bull; <b>The Solution:</b> A multi-tenant SaaS delivering floor-level daily updates in Tamil/English, transparent mathematical run-rate delay projections 2 weeks early, immutable buyer compliance change tracking, and isolated buyer portals.",
        body_style
    ))

    # 2. System Architecture Diagram & Tech Stack
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    story.append(Paragraph(
        "<b>Tech Stack Choices:</b> Next.js 15 (App Router, Server Actions, React 19) provides hybrid server-side rendering and client interactivity. SQLite with Prisma ORM 7 (`@prisma/adapter-libsql`) eliminates external database setup hurdles for local verification. Dexie.js (IndexedDB) supports offline updates for patchy factory network environments.",
        body_style
    ))
    story.append(Spacer(1, 4))
    story.append(draw_architecture_diagram())
    story.append(Spacer(1, 6))

    # 3. Data Model Table (Properly wrapped in Paragraphs so it NEVER cuts off)
    story.append(Paragraph("3. Relational Data Model (Schema Design)", h1_style))
    
    raw_data = [
        [
            Paragraph("Entity", tbl_head),
            Paragraph("Core Business Purpose", tbl_head),
            Paragraph("Key Attributes & Constraints", tbl_head)
        ],
        [
            Paragraph("Order", tbl_bold),
            Paragraph("Primary production order record", tbl_cell),
            Paragraph("poNumber (unique), buyerId, unitId, style, color, totalQuantity, exFactoryDate, currentStage, currentProducedQty, riskStatus (GREEN/AMBER/RED)", tbl_cell)
        ],
        [
            Paragraph("Milestone", tbl_bold),
            Paragraph("6-stage Time-and-Action (TNA) schedule", tbl_cell),
            Paragraph("orderId, stage (Cutting &rarr; Printing &rarr; Stitching &rarr; Washing &rarr; Finishing &rarr; Packing), sequence, targetDate, completedDate, status", tbl_cell)
        ],
        [
            Paragraph("DailyUpdate", tbl_bold),
            Paragraph("Floor quantity & observation entry", tbl_cell),
            Paragraph("orderId, unitId, stage, quantityCompleted, photoUrl (base64 image), voiceUrl (audio), rawNote, language (ta/en), supervisorName", tbl_cell)
        ],
        [
            Paragraph("AIAnalysis", tbl_bold),
            Paragraph("Dual-language governance record", tbl_cell),
            Paragraph("dailyUpdateId, originalNote (Tamil), translation (English), predictedCategory, confidence, finalCategory, isOverridden, reviewedBy", tbl_cell)
        ],
        [
            Paragraph("DelayWarning", tbl_bold),
            Paragraph("Run-rate alerts with buyer visibility gate", tbl_cell),
            Paragraph("orderId, severity (AMBER/RED), actualRate, requiredRate, projectedDelayDays, isApprovedForBuyer (boolean gate), approvedBy", tbl_cell)
        ],
        [
            Paragraph("AuditLog", tbl_bold),
            Paragraph("Immutable EU/UK compliance change log", tbl_cell),
            Paragraph("orderId, field, oldValue, newValue, changedBy, reason (mandatory justification), timestamp", tbl_cell)
        ]
    ]

    # Total width: 540 (fits letter page: 612 - 72 = 540)
    col_widths = [75, 145, 320]
    t = Table(raw_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # 4. Mathematical Run-Rate Delay Engine
    story.append(Paragraph("4. Mathematical Run-Rate Delay Engine (The Core Hard Part)", h1_style))
    story.append(Paragraph(
        "Instead of subjective merchandiser intuition, delays are flagged 2 weeks early via transparent throughput run-rate equations:<br/>"
        "&bull; <b>Remaining Quantity:</b> Total Order Quantity &minus; Cumulative Produced Quantity<br/>"
        "&bull; <b>Days Left:</b> Ex-Factory Delivery Date &minus; Today's Reference Date<br/>"
        "&bull; <b>Required Run-Rate:</b> Remaining Quantity &divide; Days Left (pieces per day required)<br/>"
        "&bull; <b>Actual Output Rate:</b> 7-day rolling average of completed stage output on the floor (pieces per day)<br/>"
        "&bull; <b>Projected Days Needed:</b> Remaining Quantity &divide; Actual Output Rate<br/>"
        "&bull; <b>Projected Delay Days:</b> Projected Days Needed &minus; Days Left<br/>"
        "<b>Status Thresholds:</b><br/>"
        "&bull; <b>GREEN (On Schedule):</b> Actual Rate &ge; Required Rate (Delay &le; 0 days)<br/>"
        "&bull; <b>AMBER (Early Warning):</b> 0 &lt; Projected Delay &le; 3.0 days (Early alert; internal floor intervention needed)<br/>"
        "&bull; <b>RED (Critical Risk):</b> Projected Delay &gt; 3.0 days (Threatens air freight/discount; triggers merchandiser approval gate)",
        body_style
    ))

    # 5. Tamil Voice & AI Root Cause Classification
    story.append(Paragraph("5. Tamil Voice Processing & AI Root Cause Pipeline", h1_style))
    story.append(Paragraph(
        "1. <b>Audio Floor Capture:</b> Standard HTML5 MediaRecorder captures voice notes on cheap Android devices (2–3 GB RAM).<br/>"
        "2. <b>Bilingual Transcription:</b> Native speech recognition extracts Tamil (ta-IN) or English (en-US) into text with instant audio playback.<br/>"
        "3. <b>Dual-Column Auditability:</b> Original Tamil text is preserved permanently beside the English translation to eliminate translation disputes.<br/>"
        "4. <b>Root Cause Classification:</b> Groq Llama 3.3 70B (with deterministic shopfloor NLP fallback) classifies notes into 8 root cause categories: <i>Machine Breakdown, Material Delay, Quality Issue, Labour Shortage, Printing Delay, Washing Delay, Approval Pending, Other</i>.<br/>"
        "5. <b>Merchandiser Approval Gate:</b> Merchandisers can override incorrect AI categories. Crucially, warnings reach the buyer portal <b>only</b> after explicit merchandiser confirmation.",
        body_style
    ))

    # 6. UI/UX Decisions & RBAC Isolation
    story.append(Paragraph("6. Key Screens & Security Isolation", h1_style))
    story.append(Paragraph(
        "&bull; <b>Order Board (`/`):</b> Minimalist table with status color badges, buyer/unit filters, and a 'Math Proof' modal detailing exact formula steps.<br/>"
        "&bull; <b>Order 360&deg; Details (`/orders/[id]`):</b> Full view with 6-stage TNA timeline, size matrix, delay warning gate, and compliance history.<br/>"
        "&bull; <b>Supervisor Floor Entry (`/supervisor`):</b> Mobile-first ergonomics with large numeric buttons, 1-tap Tamil quick chips, voice recording player, and Dexie offline sync.<br/>"
        "&bull; <b>Multi-Tenant Buyer Portal (`/buyer`):</b> Strict isolation prevents Company B from seeing Company C orders, styles, or unapproved warnings.<br/>"
        "&bull; <b>Compliance Audit Trail (`/audit`):</b> Immutably records every ex-factory date adjustment with mandatory reasons for EU/UK compliance.",
        body_style
    ))

    # 7. Assumptions & Next Steps
    story.append(Paragraph("7. Scoping, Assumptions & Future Roadmap", h1_style))
    story.append(Paragraph(
        "&bull; <b>Assumptions:</b> 6-day production work week in Tiruppur textile cluster; completed TNA milestones retain historical dates during adjustments.<br/>"
        "&bull; <b>Out of Scope (By Design):</b> Fabric inventory, piece-rate worker payroll, customs export documentation (per client brief).<br/>"
        "&bull; <b>Future Enhancements:</b> Automated WhatsApp Twilio bot for supervisors without mobile browsers; IoT stitch-counting sensors on sewing machines.",
        body_style
    ))

    doc.build(story)
    print("New high-quality PDF generated successfully:", pdf_path)

if __name__ == "__main__":
    generate_pdf()
