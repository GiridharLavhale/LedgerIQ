"""
Multi-Format Financial Reporting and Export Service (CSV, XLSX, PDF)
"""
import io
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.models.batch import ReconciliationBatch
from app.models.transaction import Transaction
from app.models.exception import ExceptionRecord
from app.models.match import ReconciliationMatch


class ReportService:

    @classmethod
    def generate_reconciliation_csv(cls, batch: ReconciliationBatch, matches: List[ReconciliationMatch], transactions: List[Transaction]) -> bytes:
        """Generates CSV export of all transactions and their match status."""
        data = []
        for t in transactions:
            data.append({
                "Transaction ID": t.id,
                "Reference ID": t.reference_id or t.external_id,
                "Source Type": t.source_type,
                "Gross Amount (INR)": float(t.amount),
                "Fee (INR)": float(t.fee),
                "Tax (INR)": float(t.tax),
                "Net Amount (INR)": float(t.net_amount),
                "Status": t.status,
                "Date": t.transaction_date.isoformat(),
                "Counterparty": t.counterparty or "N/A"
            })
        df = pd.DataFrame(data)
        out = io.BytesIO()
        df.to_csv(out, index=False, encoding="utf-8-sig")
        return out.getvalue()

    @classmethod
    def generate_reconciliation_xlsx(cls, batch: ReconciliationBatch, matches: List[ReconciliationMatch], exceptions: List[ExceptionRecord]) -> bytes:
        """Generates multi-sheet XLSX report with Batch Summary, Matches, and Exceptions."""
        out = io.BytesIO()
        with pd.ExcelWriter(out, engine="openpyxl") as writer:
            # Sheet 1: Summary KPIs
            summary_data = [
                {"Metric": "Batch Name", "Value": batch.name},
                {"Metric": "Status", "Value": batch.status},
                {"Metric": "Total Records", "Value": batch.total_records},
                {"Metric": "Matched Records", "Value": batch.matched_records},
                {"Metric": "Exception Records", "Value": batch.exception_records},
                {"Metric": "Match Rate (%)", "Value": f"{batch.match_rate}%"},
                {"Metric": "Exception Rate (%)", "Value": f"{batch.exception_rate}%"},
                {"Metric": "Total Volume (INR)", "Value": float(batch.total_volume)},
                {"Metric": "Discrepancy Amount (INR)", "Value": float(batch.discrepancy_amount)},
                {"Metric": "Throughput (RPS)", "Value": batch.throughput_rps},
                {"Metric": "Execution Time (ms)", "Value": batch.processing_time_ms}
            ]
            pd.DataFrame(summary_data).to_excel(writer, sheet_name="Executive Summary", index=False)

            # Sheet 2: Matches
            match_rows = [
                {
                    "Match ID": m.id,
                    "Strategy": m.strategy,
                    "Confidence": f"{m.confidence * 100:.1f}%",
                    "Amount Diff (INR)": float(m.amount_difference),
                    "Date Diff (Days)": m.date_difference_days,
                    "Calculated Fee (INR)": float(m.calculated_fee),
                    "Calculated Tax (INR)": float(m.calculated_tax),
                    "Evidence": m.evidence_summary
                }
                for m in matches
            ]
            pd.DataFrame(match_rows).to_excel(writer, sheet_name="Matches", index=False)

            # Sheet 3: Exceptions
            exc_rows = [
                {
                    "Exception ID": e.id,
                    "Type": e.exception_type,
                    "Severity": e.severity,
                    "Status": e.status,
                    "Expected (INR)": float(e.expected_amount),
                    "Actual (INR)": float(e.actual_amount),
                    "Difference (INR)": float(e.difference_amount),
                    "AI Root Cause Explanation": e.ai_explanation or "N/A",
                    "AI Recommended Action": e.ai_recommended_action or "N/A"
                }
                for e in exceptions
            ]
            pd.DataFrame(exc_rows).to_excel(writer, sheet_name="Exceptions Log", index=False)

        return out.getvalue()

    @classmethod
    def generate_pdf_report(cls, batch: ReconciliationBatch, exceptions: List[ExceptionRecord]) -> bytes:
        """Generates formal printable PDF executive audit report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=12
        )
        elements.append(Paragraph(f"LedgerIQ — Financial Reconciliation Report", title_style))
        elements.append(Paragraph(f"<b>Batch:</b> {batch.name} | <b>Generated:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", styles["Normal"]))
        elements.append(Spacer(1, 14))

        # KPI Summary Table
        summary_table_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Total Volume", f"INR {float(batch.total_volume):,.2f}", "Match Rate", f"{batch.match_rate}%"],
            ["Matched Volume", f"INR {float(batch.matched_volume):,.2f}", "Total Records", f"{batch.total_records:,}"],
            ["Discrepancy Amount", f"INR {float(batch.discrepancy_amount):,.2f}", "Exceptions", f"{batch.exception_records:,}"],
            ["Processing Speed", f"{batch.throughput_rps:,.1f} RPS", "Duration", f"{batch.processing_time_ms} ms"],
        ]
        t = Table(summary_table_data, colWidths=[130, 140, 130, 140])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 18))

        # Top Exceptions Section
        elements.append(Paragraph("<b>Flagged Exceptions & Discrepancies (Top 10)</b>", styles["Heading2"]))
        elements.append(Spacer(1, 8))

        exc_table_data = [["Exception Type", "Severity", "Expected", "Actual", "Variance", "AI Recommendation"]]
        for e in exceptions[:10]:
            exc_table_data.append([
                e.exception_type,
                e.severity,
                f"{float(e.expected_amount):,.2f}",
                f"{float(e.actual_amount):,.2f}",
                f"{float(e.difference_amount):,.2f}",
                e.ai_recommended_action or "REVIEW"
            ])

        if len(exc_table_data) > 1:
            et = Table(exc_table_data, colWidths=[110, 60, 75, 75, 75, 145])
            et.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ]))
            elements.append(et)
        else:
            elements.append(Paragraph("No exceptions recorded in this batch.", styles["Normal"]))

        doc.build(elements)
        return buffer.getvalue()
