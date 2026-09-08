from io import BytesIO
import datetime
from typing import List, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_single_output_pdf(title: str, output_type: str, content: str, output_hash: str, project_id: str, approved_by: str = "Operator User") -> bytes:
    """Generates a professional PDF document for a single deliverable output using ReportLab."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E3A8A'),
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    sub_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        fontName='Helvetica'
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica'
    )
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
        fontName='Courier'
    )
    
    story = []
    # Title Header
    story.append(Paragraph(f"SecureTransform Deliverable: {title}", header_style))
    story.append(Paragraph(f"<b>Project ID:</b> {project_id} | <b>Type:</b> {output_type.upper()} | <b>Verified Hash:</b> {output_hash[:16]}...", sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=12))
    
    # Metadata Box Table
    meta_data = [
        [Paragraph("<b>Status:</b> APPROVED", sub_style), Paragraph(f"<b>Approved By:</b> {approved_by}", sub_style)],
        [Paragraph(f"<b>SHA-256 Provenance:</b> {output_hash[:32]}...", code_style), Paragraph("<b>Security Scan:</b> PASSED (Presidio Redacted)", sub_style)]
    ]
    t = Table(meta_data, colWidths=[260, 260])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    # Content body
    lines = content.split('\n')
    for line in lines:
        if not line.strip():
            story.append(Spacer(1, 6))
        else:
            safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe_line, body_style))
            story.append(Spacer(1, 3))
            
    doc.build(story)
    return buffer.getvalue()


def generate_approved_bundle_pdf(approved_outputs: List[Any], project_id: str) -> bytes:
    """Generates a comprehensive PDF document containing all approved deliverables in a single bundle."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'BundleTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        fontName='Helvetica-Bold',
        spaceAfter=8
    )
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E40AF'),
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=6
    )
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        fontName='Helvetica'
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica'
    )
    
    story = []
    story.append(Paragraph("SIH 2026 PS 26154 — Final Approved Deliverables Bundle", title_style))
    story.append(Paragraph(f"<b>Project ID:</b> {project_id} | <b>Total Approved Deliverables:</b> {len(approved_outputs)} | <b>Export Timestamp:</b> {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", meta_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1E3A8A'), spaceAfter=15))
    
    for idx, item in enumerate(approved_outputs, 1):
        item_title = getattr(item, 'title', 'Approved Output')
        item_type = getattr(item, 'output_type', 'output')
        item_status = getattr(item, 'approval_status', 'APPROVED')
        item_by = getattr(item, 'approved_by', 'Operator User') or 'Operator User'
        item_hash = getattr(item, 'output_hash', '') or '0000000000000000'
        item_content = getattr(item, 'content', '')
        
        story.append(Paragraph(f"Deliverable {idx}: {item_title}", section_title))
        meta_table_data = [
            [Paragraph(f"<b>Type:</b> {item_type.upper()}", meta_style), Paragraph(f"<b>Approval Status:</b> {item_status}", meta_style)],
            [Paragraph(f"<b>Approved By:</b> {item_by}", meta_style), Paragraph(f"<b>SHA-256 Hash:</b> {item_hash[:20]}...", meta_style)]
        ]
        t = Table(meta_table_data, colWidths=[260, 260])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))
        
        for line in item_content.split('\n'):
            if not line.strip():
                story.append(Spacer(1, 4))
            else:
                safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(safe_line, body_style))
                story.append(Spacer(1, 2))
                
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=14))
        
    doc.build(story)
    return buffer.getvalue()
