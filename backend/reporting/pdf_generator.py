from __future__ import annotations

import logging
from fpdf import FPDF

logger = logging.getLogger("uvicorn.error")

def clean_txt(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    replacements = {
        "\u2014": "-", # em dash
        "\u2013": "-", # en dash
        "\u2018": "'", # left single quote
        "\u2019": "'", # right single quote
        "\u201c": '"', # left double quote
        "\u201d": '"', # right double quote
        "\u2022": "*", # bullet point
        "\u2026": "...", # ellipsis
        "\u00a0": " ", # non-breaking space
        "\u2192": "->", # right arrow
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Convert string to safe latin-1 character set by replacing unsupported characters
    return text.encode("latin-1", "replace").decode("latin-1")


class CustomPDF(FPDF):
    def __init__(self, run_data: dict):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.run_data = run_data
        self.set_margins(15, 15, 15)
        self.set_auto_page_break(auto=True, margin=15)
        self.alias_nb_pages()

    def header(self):
        # Header on every page
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(100, 116, 139) # #64748b
        model_name = self.run_data.get("model_id", "Unknown")
        self.cell(90, 8, clean_txt(f"LLM Red-Teaming Report - Model: {model_name}"), align="L")
        self.cell(90, 8, clean_txt(f"Run ID: {self.run_data.get('run_id', '')[:8]}"), align="R")
        self.ln(8)
        self.set_draw_color(226, 232, 240) # #e2e8f0
        self.set_line_width(0.2)
        self.line(15, 22, 195, 22)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184) # #94a3b8
        end_time_str = self.run_data.get("end_time", "")[:19].replace("T", " ")
        self.cell(0, 10, clean_txt(f"Page {self.page_no()}/{{nb}} - Generated on {end_time_str}"), align="C")


class PDFReportGenerator:
    def __init__(self):
        pass

    def generate(self, run_data: dict) -> bytes:
        try:
            pdf = CustomPDF(run_data)
            pdf.add_page()
            
            # Title Block
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(15, 23, 42) # #0f172a
            pdf.cell(0, 10, clean_txt("LLM Red-Teaming Evaluation Report"), new_x="LMARGIN", new_y="NEXT", align="L")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(100, 116, 139) # #64748b
            end_time_str = run_data.get("end_time", "")[:19].replace("T", " ")
            pdf.cell(0, 6, clean_txt(f"Generated: {end_time_str} UTC"), new_x="LMARGIN", new_y="NEXT", align="L")
            pdf.ln(5)
            
            # Metadata KPI section (Cards-like structure)
            pdf.set_fill_color(248, 250, 252) # #f8fafc
            pdf.set_draw_color(226, 232, 240) # #e2e8f0
            pdf.rect(15, pdf.get_y(), 180, 24, "DF")
            
            start_y = pdf.get_y()
            pdf.set_y(start_y + 3)
            
            col_width = 45
            
            # Labels
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(148, 163, 184) # #94a3b8
            pdf.set_x(15)
            pdf.cell(col_width, 4, clean_txt("TARGET MODEL"), align="C")
            pdf.cell(col_width, 4, clean_txt("SAFETY SCORE"), align="C")
            pdf.cell(col_width, 4, clean_txt("TEST DURATION"), align="C")
            pdf.cell(col_width, 4, clean_txt("CATEGORIES"), align="C")
            pdf.ln(5)
            
            # Values
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.set_x(15)
            
            model_id = run_data.get("model_id", "Unknown")
            if ":" in model_id:
                model_id_short = model_id.split(":", 1)[1]
            else:
                model_id_short = model_id
            pdf.cell(col_width, 6, clean_txt(model_id_short[:16]), align="C")
            
            # Overall score with color styling
            score = run_data.get("overall_score", 0)
            if score >= 80:
                pdf.set_text_color(22, 163, 74) # green
            elif score >= 60:
                pdf.set_text_color(217, 119, 6) # yellow/orange
            else:
                pdf.set_text_color(220, 38, 38) # red
            
            pdf.set_font("Helvetica", "B", 14)
            pdf.cell(col_width, 6, clean_txt(f"{score}%"), align="C")
            
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(col_width, 6, clean_txt(f"{run_data.get('duration_seconds', 0)}s"), align="C")
            
            num_categories = len(run_data.get("categories", []))
            pdf.cell(col_width, 6, clean_txt(str(num_categories)), align="C")
            
            pdf.set_y(start_y + 24 + 8)
            
            # Section: Category Results
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 8, clean_txt("CATEGORY PERFORMANCE SUMMARY"), new_x="LMARGIN", new_y="NEXT")
            
            # Draw table header
            pdf.set_fill_color(241, 245, 249) # #f1f5f9
            pdf.set_draw_color(226, 232, 240)
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(71, 85, 105) # #475569
            
            pdf.cell(50, 8, clean_txt(" Category"), border=1, fill=True)
            pdf.cell(25, 8, clean_txt(" Score"), border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Fail Rate"), border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Prompts"), border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Failures"), border=1, fill=True, align="C")
            pdf.cell(30, 8, clean_txt(" Duration"), border=1, fill=True, align="C")
            pdf.ln()
            
            # Rows
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(55, 65, 81) # #374151
            
            results = run_data.get("results", {})
            row_idx = 0
            for cat_id, data in results.items():
                score_pct = int(round(data.get("score", 0) * 100))
                fail_rate = data.get("failure_rate", 0) * 100
                total = data.get("total", 0)
                failures = data.get("failures", 0)
                duration = data.get("duration_seconds", 0)
                
                fill = row_idx % 2 == 1
                pdf.set_fill_color(248, 250, 252)
                
                cat_label = cat_id.replace("_", " ").title()
                
                pdf.cell(50, 8, clean_txt(f" {cat_label}"), border=1, fill=fill)
                
                if score_pct >= 80:
                    pdf.set_text_color(22, 163, 74)
                elif score_pct >= 60:
                    pdf.set_text_color(217, 119, 6)
                else:
                    pdf.set_text_color(220, 38, 38)
                pdf.cell(25, 8, clean_txt(f"{score_pct}%"), border=1, fill=fill, align="C")
                
                pdf.set_text_color(55, 65, 81)
                pdf.cell(25, 8, clean_txt(f"{fail_rate:.1f}%"), border=1, fill=fill, align="C")
                pdf.cell(25, 8, clean_txt(str(total)), border=1, fill=fill, align="C")
                pdf.cell(25, 8, clean_txt(str(failures)), border=1, fill=fill, align="C")
                pdf.cell(30, 8, clean_txt(f"{duration:.1f}s"), border=1, fill=fill, align="C")
                pdf.ln()
                row_idx += 1
                
            pdf.ln(6)
            
            # Section: Comparison Results (if available)
            compare_results = run_data.get("compare_results")
            if compare_results:
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("COMPARATIVE EVALUATION"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)
                
                comp_model_id = run_data.get("compare_model_id", "Comparison Model")
                if ":" in comp_model_id:
                    comp_model_id_short = comp_model_id.split(":", 1)[1]
                else:
                    comp_model_id_short = comp_model_id
                    
                pdf.cell(60, 8, clean_txt(" Category"), border=1, fill=True)
                pdf.cell(40, 8, clean_txt(f" {model_id_short[:16]} Score"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(f" {comp_model_id_short[:16]} Score"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Difference"), border=1, fill=True, align="C")
                pdf.ln()
                
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(55, 65, 81)
                
                row_idx = 0
                for cat_id, data in results.items():
                    comp_data = compare_results.get(cat_id)
                    if not comp_data:
                        continue
                    
                    score_pct = int(round(data.get("score", 0) * 100))
                    comp_score_pct = int(round(comp_data.get("score", 0) * 100))
                    diff = score_pct - comp_score_pct
                    
                    fill = row_idx % 2 == 1
                    pdf.set_fill_color(248, 250, 252)
                    
                    cat_label = cat_id.replace("_", " ").title()
                    pdf.cell(60, 8, clean_txt(f" {cat_label}"), border=1, fill=fill)
                    
                    if score_pct >= 80:
                        pdf.set_text_color(22, 163, 74)
                    elif score_pct >= 60:
                        pdf.set_text_color(217, 119, 6)
                    else:
                        pdf.set_text_color(220, 38, 38)
                    pdf.cell(40, 8, clean_txt(f"{score_pct}%"), border=1, fill=fill, align="C")
                    
                    if comp_score_pct >= 80:
                        pdf.set_text_color(22, 163, 74)
                    elif comp_score_pct >= 60:
                        pdf.set_text_color(217, 119, 6)
                    else:
                        pdf.set_text_color(220, 38, 38)
                    pdf.cell(40, 8, clean_txt(f"{comp_score_pct}%"), border=1, fill=fill, align="C")
                    
                    if diff > 0:
                        pdf.set_text_color(22, 163, 74)
                        diff_str = f"+{diff}%"
                    elif diff < 0:
                        pdf.set_text_color(220, 38, 38)
                        diff_str = f"{diff}%"
                    else:
                        pdf.set_text_color(100, 116, 139)
                        diff_str = "0%"
                        
                    pdf.cell(40, 8, clean_txt(diff_str), border=1, fill=fill, align="C")
                    pdf.ln()
                    row_idx += 1
                    
                pdf.ln(6)
                
            # Section: Iterative Red-Teaming Results (if available)
            iterative_results = run_data.get("iterative_results")
            if iterative_results and iterative_results.get("categories_retested"):
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("ITERATIVE ADVERSARIAL RE-TESTING"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)
                
                pdf.cell(60, 8, clean_txt(" Category"), border=1, fill=True)
                pdf.cell(40, 8, clean_txt(" Round 1 Failure Rate"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Round 2 Failure Rate"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Improvement"), border=1, fill=True, align="C")
                pdf.ln()
                
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(55, 65, 81)
                
                row_idx = 0
                round1_data = iterative_results.get("round1", {})
                round2_data = iterative_results.get("round2", {})
                
                for cat in iterative_results.get("categories_retested", []):
                    r1 = round1_data.get(cat, 0) * 100
                    r2 = round2_data.get(cat, 0) * 100
                    improvement = r1 - r2
                    
                    fill = row_idx % 2 == 1
                    pdf.set_fill_color(248, 250, 252)
                    
                    cat_label = cat.replace("_", " ").title()
                    pdf.cell(60, 8, clean_txt(f" {cat_label}"), border=1, fill=fill)
                    pdf.cell(40, 8, clean_txt(f"{r1:.1f}%"), border=1, fill=fill, align="C")
                    pdf.cell(40, 8, clean_txt(f"{r2:.1f}%"), border=1, fill=fill, align="C")
                    
                    if improvement > 0:
                        pdf.set_text_color(22, 163, 74)
                        imp_str = f"+{improvement:.1f}%"
                    elif improvement < 0:
                        pdf.set_text_color(220, 38, 38)
                        imp_str = f"{improvement:.1f}%"
                    else:
                        pdf.set_text_color(100, 116, 139)
                        imp_str = "0.0%"
                        
                    pdf.cell(40, 8, clean_txt(imp_str), border=1, fill=fill, align="C")
                    pdf.ln()
                    row_idx += 1
                    
                pdf.ln(6)
                
            has_failures = False
            for cat_id, data in results.items():
                if data.get("failures", 0) > 0:
                    has_failures = True
                    break
                    
            if has_failures:
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("ADVERSARIAL FAILURES / WORST PROMPTS"), new_x="LMARGIN", new_y="NEXT")
                
                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)
                
                pdf.cell(40, 8, clean_txt(" Category"), border=1, fill=True)
                pdf.cell(100, 8, clean_txt(" Vulnerable Prompt"), border=1, fill=True)
                pdf.cell(40, 8, clean_txt(" Failure Type"), border=1, fill=True, align="C")
                pdf.ln()
                
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(55, 65, 81)
                
                row_idx = 0
                for cat_id, data in results.items():
                    for pr in data.get("prompt_results", []):
                        if not pr.get("passed", True):
                            fill = row_idx % 2 == 1
                            pdf.set_fill_color(248, 250, 252)
                            
                            cat_label = cat_id.replace("_", " ").title()
                            prompt_text = pr.get("prompt", "")
                            if len(prompt_text) > 85:
                                prompt_text = prompt_text[:82] + "..."
                                
                            fail_type = pr.get("failure_type") or "failed"
                            fail_type_label = fail_type.replace("_", " ").title()
                            
                            pdf.cell(40, 8, clean_txt(f" {cat_label}"), border=1, fill=fill)
                            pdf.cell(100, 8, clean_txt(f" {prompt_text}"), border=1, fill=fill)
                            pdf.set_text_color(220, 38, 38)
                            pdf.cell(40, 8, clean_txt(f" {fail_type_label}"), border=1, fill=fill, align="C")
                            pdf.set_text_color(55, 65, 81)
                            pdf.ln()
                            row_idx += 1
                            
                            if row_idx >= 25:
                                break
                    if row_idx >= 25:
                        break
                        
            return pdf.output()
            
        except Exception as exc:
            logger.exception("Failed to generate PDF report using fpdf2: %s", exc)
            # Fallback to UTF-8 encoded template warning
            return f"Error generating PDF: {str(exc)}".encode("utf-8")
