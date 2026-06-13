from __future__ import annotations

import logging
from fpdf import FPDF
from fpdf.enums import XPos, YPos

logger = logging.getLogger("uvicorn.error")


def clean_txt(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    replacements = {
        "\u2014": "-",   # em dash
        "\u2013": "-",   # en dash
        "\u2018": "'",   # left single quote
        "\u2019": "'",   # right single quote
        "\u201c": '"',   # left double quote
        "\u201d": '"',   # right double quote
        "\u2022": "*",   # bullet point
        "\u2026": "...", # ellipsis
        "\u00a0": " ",   # non-breaking space
        "\u2192": "->",  # right arrow
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "replace").decode("latin-1")


class CustomPDF(FPDF):
    def __init__(self, run_data: dict) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.run_data = run_data
        self.set_margins(15, 15, 15)
        self.set_auto_page_break(auto=True, margin=15)
        self.alias_nb_pages()

    def header(self) -> None:
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(100, 116, 139)
        model_name = self.run_data.get("model_id", "Unknown")
        self.cell(90, 8, clean_txt(f"LLM Red-Teaming Report - Model: {model_name}"), align="L")
        self.cell(90, 8, clean_txt(f"Run ID: {self.run_data.get('run_id', '')[:8]}"), align="R")
        self.ln(8)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.2)
        self.line(15, 22, 195, 22)
        self.ln(5)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        end_time_str = self.run_data.get("end_time", "")[:19].replace("T", " ")
        self.cell(0, 10, clean_txt(f"Page {self.page_no()}/{{nb}} - Generated on {end_time_str}"), align="C")


class PDFReportGenerator:
    def __init__(self) -> None:
        pass

    def generate(self, run_data: dict) -> bytes:
        try:
            pdf = CustomPDF(run_data)
            pdf.add_page()

            # ── Title Block ────────────────────────────────────────────────
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(
                0, 10,
                clean_txt("LLM Red-Teaming Evaluation Report"),
                new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L",
            )
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(100, 116, 139)
            end_time_str = run_data.get("end_time", "")[:19].replace("T", " ")
            pdf.cell(
                0, 6,
                clean_txt(f"Generated: {end_time_str} UTC"),
                new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L",
            )
            pdf.ln(5)

            # ── KPI Cards ──────────────────────────────────────────────────
            pdf.set_fill_color(248, 250, 252)
            pdf.set_draw_color(226, 232, 240)
            pdf.rect(15, pdf.get_y(), 180, 24, "DF")

            start_y = pdf.get_y()
            pdf.set_y(start_y + 3)

            col_width = 45

            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(148, 163, 184)
            pdf.set_x(15)
            pdf.cell(col_width, 4, clean_txt("TARGET MODEL"), align="C")
            pdf.cell(col_width, 4, clean_txt("SAFETY SCORE"), align="C")
            pdf.cell(col_width, 4, clean_txt("TEST DURATION"), align="C")
            pdf.cell(col_width, 4, clean_txt("CATEGORIES"), align="C")
            pdf.ln(5)

            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.set_x(15)

            model_id = run_data.get("model_id", "Unknown")
            model_id_short = model_id.split(":", 1)[1] if ":" in model_id else model_id
            pdf.cell(col_width, 6, clean_txt(model_id_short[:16]), align="C")

            score = run_data.get("overall_score", 0)
            if score >= 80:
                pdf.set_text_color(22, 163, 74)
            elif score >= 60:
                pdf.set_text_color(217, 119, 6)
            else:
                pdf.set_text_color(220, 38, 38)

            pdf.set_font("Helvetica", "B", 14)
            pdf.cell(col_width, 6, clean_txt(f"{score}%"), align="C")

            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(col_width, 6, clean_txt(f"{run_data.get('duration_seconds', 0)}s"), align="C")

            num_categories = len(run_data.get("categories", []))
            pdf.cell(col_width, 6, clean_txt(str(num_categories)), align="C")

            pdf.set_y(start_y + 24 + 8)

            # ── Category Results Table ─────────────────────────────────────
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 8, clean_txt("CATEGORY PERFORMANCE SUMMARY"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            pdf.set_fill_color(241, 245, 249)
            pdf.set_draw_color(226, 232, 240)
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(71, 85, 105)

            pdf.cell(50, 8, clean_txt(" Category"),   border=1, fill=True)
            pdf.cell(25, 8, clean_txt(" Score"),      border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Fail Rate"),  border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Prompts"),    border=1, fill=True, align="C")
            pdf.cell(25, 8, clean_txt(" Failures"),   border=1, fill=True, align="C")
            pdf.cell(30, 8, clean_txt(" Duration"),   border=1, fill=True, align="C")
            pdf.ln()

            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(55, 65, 81)

            results: dict = run_data.get("results", {})
            for row_idx, (cat_id, data) in enumerate(results.items()):
                score_pct = int(round(data.get("score", 0) * 100))
                fail_rate = data.get("failure_rate", 0) * 100
                total     = data.get("total", 0)
                failures  = data.get("failures", 0)
                duration  = data.get("duration_seconds", 0)

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
                pdf.cell(25, 8, clean_txt(str(total)),          border=1, fill=fill, align="C")
                pdf.cell(25, 8, clean_txt(str(failures)),       border=1, fill=fill, align="C")
                pdf.cell(30, 8, clean_txt(f"{duration:.1f}s"),  border=1, fill=fill, align="C")
                pdf.ln()

            pdf.ln(6)

            # ── Comparison Results ─────────────────────────────────────────
            compare_results: dict | None = run_data.get("compare_results")
            if compare_results:
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("COMPARATIVE EVALUATION"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)

                comp_model_id = run_data.get("compare_model_id", "Comparison Model")
                comp_model_id_short = comp_model_id.split(":", 1)[1] if ":" in comp_model_id else comp_model_id

                pdf.cell(60, 8, clean_txt(" Category"),                              border=1, fill=True)
                pdf.cell(40, 8, clean_txt(f" {model_id_short[:16]} Score"),          border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(f" {comp_model_id_short[:16]} Score"),     border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Difference"),                            border=1, fill=True, align="C")
                pdf.ln()

                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(55, 65, 81)

                for row_idx, (cat_id, data) in enumerate(results.items()):
                    comp_data = compare_results.get(cat_id)
                    if not comp_data:
                        continue

                    score_pct      = int(round(data.get("score", 0) * 100))
                    comp_score_pct = int(round(comp_data.get("score", 0) * 100))
                    diff           = score_pct - comp_score_pct

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

                pdf.ln(6)

            # ── Iterative MART Results ─────────────────────────────────────
            iterative_results: dict | None = run_data.get("iterative_results")
            if iterative_results and iterative_results.get("categories_retested"):
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("ITERATIVE ADVERSARIAL RE-TESTING"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)

                pdf.cell(60, 8, clean_txt(" Category"),             border=1, fill=True)
                pdf.cell(40, 8, clean_txt(" Round 1 Failure Rate"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Round 2 Failure Rate"), border=1, fill=True, align="C")
                pdf.cell(40, 8, clean_txt(" Improvement"),          border=1, fill=True, align="C")
                pdf.ln()

                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(55, 65, 81)

                round1_data: dict = iterative_results.get("round1", {})
                round2_data: dict = iterative_results.get("round2", {})

                for row_idx, cat in enumerate(iterative_results.get("categories_retested", [])):
                    r1 = round1_data.get(cat, 0) * 100
                    r2 = round2_data.get(cat, 0) * 100
                    improvement = r1 - r2

                    fill = row_idx % 2 == 1
                    pdf.set_fill_color(248, 250, 252)

                    cat_label = cat.replace("_", " ").title()
                    pdf.cell(60, 8, clean_txt(f" {cat_label}"), border=1, fill=fill)
                    pdf.cell(40, 8, clean_txt(f"{r1:.1f}%"),    border=1, fill=fill, align="C")
                    pdf.cell(40, 8, clean_txt(f"{r2:.1f}%"),    border=1, fill=fill, align="C")

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

                pdf.ln(6)

            # ── Adversarial Failures Table ─────────────────────────────────
            has_failures = any(d.get("failures", 0) > 0 for d in results.values())

            if has_failures:
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 8, clean_txt("ADVERSARIAL FAILURES / WORST PROMPTS"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

                pdf.set_fill_color(241, 245, 249)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(71, 85, 105)

                pdf.cell(40,  8, clean_txt(" Category"),         border=1, fill=True)
                pdf.cell(100, 8, clean_txt(" Vulnerable Prompt"),border=1, fill=True)
                pdf.cell(40,  8, clean_txt(" Failure Type"),     border=1, fill=True, align="C")
                pdf.ln()

                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(55, 65, 81)

                row_idx = 0
                done = False
                for cat_id, data in results.items():
                    if done:
                        break
                    for pr in data.get("prompt_results", []):
                        if pr.get("passed", True):
                            continue

                        fill = row_idx % 2 == 1
                        pdf.set_fill_color(248, 250, 252)

                        cat_label   = cat_id.replace("_", " ").title()
                        prompt_text = pr.get("prompt", "")
                        if len(prompt_text) > 85:
                            prompt_text = prompt_text[:82] + "..."

                        fail_type       = pr.get("failure_type") or "failed"
                        fail_type_label = fail_type.replace("_", " ").title()

                        pdf.cell(40,  8, clean_txt(f" {cat_label}"),       border=1, fill=fill)
                        pdf.cell(100, 8, clean_txt(f" {prompt_text}"),     border=1, fill=fill)
                        pdf.set_text_color(220, 38, 38)
                        pdf.cell(40,  8, clean_txt(f" {fail_type_label}"), border=1, fill=fill, align="C")
                        pdf.set_text_color(55, 65, 81)
                        pdf.ln()
                        row_idx += 1

                        if row_idx >= 25:
                            done = True
                            break

            output = pdf.output()
            # fpdf2 output() returns bytes directly
            return output if isinstance(output, bytes) else bytes(output)

        except Exception as exc:
            logger.exception("Failed to generate PDF report using fpdf2: %s", exc)
            return f"Error generating PDF: {exc!s}".encode("utf-8")
