"""
Generate a PDF report of detected goalkeepers grouped by club,
enriched with personal data from Membres namur 2.csv.
"""
import csv
import io
import os
from collections import defaultdict

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Paths ──────────────────────────────────────────────────────────────────────
import sys

RESULTS  = sys.argv[1] if len(sys.argv) > 1 else "output/results_merged.csv"
MEMBRES  = sys.argv[2] if len(sys.argv) > 2 else "/Users/jeremydevriendt/Downloads/Membres namur 2.csv"
_label   = os.path.splitext(os.path.basename(MEMBRES))[0].replace(" ", "_")
OUT_PDF  = sys.argv[3] if len(sys.argv) > 3 else f"output/gardiens_{_label}_rapport.pdf"

# ── Colors ─────────────────────────────────────────────────────────────────────
GOLD    = colors.HexColor("#C9A84C")
DARK    = colors.HexColor("#1A1A2E")
WHITE   = colors.white
LIGHT   = colors.HexColor("#F3EFE7")
GREEN   = colors.HexColor("#10B981")
ORANGE  = colors.HexColor("#F59E0B")
RED     = colors.HexColor("#E05252")
GREY    = colors.HexColor("#6B7280")


# ── Load data ──────────────────────────────────────────────────────────────────
def load_csv(path, enc="utf-8-sig", sep=";"):
    with open(path, encoding=enc, errors="replace") as f:
        return list(csv.DictReader(f, delimiter=sep))

def strip_keys(rows):
    """Strip whitespace from keys and values."""
    return [{k.strip(): (v.strip() if v else "") for k, v in r.items()} for r in rows]

results = strip_keys(load_csv(RESULTS))
membres = strip_keys(load_csv(MEMBRES, enc="latin-1"))

# Index membres by numaffil
membres_idx = {r["numaffil"]: r for r in membres if r.get("numaffil")}

# Filter gardiens only
gardiens = [r for r in results if r["statut_final"] == "gardien"]

# Group by club name
by_club = defaultdict(list)
for g in gardiens:
    by_club[g["club"]].append(g)

print(f"Gardiens: {len(gardiens)} dans {len(by_club)} clubs")


# ── Styles ─────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "Title", fontSize=22, fontName="Helvetica-Bold",
    textColor=DARK, alignment=TA_CENTER, spaceAfter=4,
)
subtitle_style = ParagraphStyle(
    "Sub", fontSize=10, fontName="Helvetica",
    textColor=GREY, alignment=TA_CENTER, spaceAfter=16,
)
club_style = ParagraphStyle(
    "Club", fontSize=14, fontName="Helvetica-Bold",
    textColor=DARK, spaceBefore=12, spaceAfter=6,
)
conf_high   = ParagraphStyle("ch", fontSize=8, fontName="Helvetica-Bold", textColor=GREEN, alignment=TA_CENTER)
conf_med    = ParagraphStyle("cm", fontSize=8, fontName="Helvetica-Bold", textColor=ORANGE, alignment=TA_CENTER)
conf_low    = ParagraphStyle("cl", fontSize=8, fontName="Helvetica-Bold", textColor=RED, alignment=TA_CENTER)
cell_style  = ParagraphStyle("cell", fontSize=8, fontName="Helvetica", leading=11)
cell_bold   = ParagraphStyle("cellb", fontSize=8, fontName="Helvetica-Bold", leading=11)
cell_small  = ParagraphStyle("cells", fontSize=7, fontName="Helvetica", textColor=GREY, leading=10)


def conf_para(conf):
    label = {"haute": "● HAUTE", "moyenne": "● MOY.", "faible": "● FAIBLE"}.get(conf, conf.upper())
    st    = {"haute": conf_high, "moyenne": conf_med, "faible": conf_low}.get(conf, cell_style)
    return Paragraph(label, st)


def build_club_table(rows):
    headers = ["Prénom / Nom", "N° Affil.", "Né(e) le", "Adresse", "Email", "GK", "Champ", "Confiance"]
    col_widths = [3.8*cm, 2.0*cm, 1.8*cm, 5.5*cm, 4.5*cm, 1.0*cm, 1.1*cm, 1.8*cm]

    data = [headers]
    for g in sorted(rows, key=lambda x: int(x["apparitions_GK"] or 0), reverse=True):
        m = membres_idx.get(g["numaffil"], {})
        name     = Paragraph(f"<b>{g['prenom']} {g['nom']}</b>", cell_bold)
        affil    = Paragraph(g["numaffil"], cell_small)
        dob      = Paragraph(m.get("datenaiss", "—"), cell_small)
        addr_parts = [m.get("adresse",""), m.get("cdepost",""), m.get("commune","")]
        addr     = Paragraph(", ".join(p for p in addr_parts if p) or "—", cell_small)
        email    = Paragraph(m.get("email", "—") or "—", cell_small)
        gk_count = Paragraph(f"<b>{g['apparitions_GK']}</b>", ParagraphStyle("gkc", fontSize=9, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=DARK))
        ch_count = Paragraph(g["apparitions_champ"], ParagraphStyle("chc", fontSize=8, fontName="Helvetica", alignment=TA_CENTER, textColor=GREY))
        conf     = conf_para(g["confiance"])
        data.append([name, affil, dob, addr, email, gk_count, ch_count, conf])

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        # Header
        ("BACKGROUND",   (0,0), (-1,0), DARK),
        ("TEXTCOLOR",    (0,0), (-1,0), GOLD),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,0), 8),
        ("ALIGN",        (0,0), (-1,0), "CENTER"),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("BOTTOMPADDING",(0,0), (-1,0), 6),
        ("TOPPADDING",   (0,0), (-1,0), 6),
        # Rows
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, LIGHT]),
        ("GRID",         (0,0), (-1,-1), 0.3, colors.HexColor("#D1C4A0")),
        ("LEFTPADDING",  (0,0), (-1,-1), 5),
        ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING",   (0,1), (-1,-1), 5),
        ("BOTTOMPADDING",(0,1), (-1,-1), 5),
        # GK column highlight
        ("BACKGROUND",   (5,1), (5,-1), colors.HexColor("#FFF7E6")),
    ]))
    return tbl


# ── Build document ─────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT_PDF,
    pagesize=landscape(A4),
    leftMargin=1.5*cm, rightMargin=1.5*cm,
    topMargin=1.5*cm, bottomMargin=1.5*cm,
)

story = []

# Cover header
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("RAPPORT GARDIENS DE BUT", title_style))
story.append(Paragraph(f"Province de Namur — Saison 2025/2026 — {len(gardiens)} gardiens détectés dans {len(by_club)} clubs", subtitle_style))
story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=12))
story.append(Spacer(1, 0.3*cm))

# Summary table
summary_data = [["Club", "Gardiens", "Top GK (apparitions)"]]
for club_name in sorted(by_club.keys()):
    rows = by_club[club_name]
    top = max(rows, key=lambda x: int(x["apparitions_GK"] or 0))
    top_name = f"{top['prenom']} {top['nom']} ({top['apparitions_GK']} GK)"
    summary_data.append([club_name, str(len(rows)), top_name])

summary_tbl = Table(summary_data, colWidths=[9*cm, 2.5*cm, 9*cm])
summary_tbl.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), DARK),
    ("TEXTCOLOR",     (0,0), (-1,0), GOLD),
    ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",      (0,0), (-1,-1), 8),
    ("ALIGN",         (1,0), (1,-1), "CENTER"),
    ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, LIGHT]),
    ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#D1C4A0")),
    ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ("TOPPADDING",    (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
story.append(summary_tbl)
story.append(PageBreak())

# One section per club
for club_name in sorted(by_club.keys()):
    rows = by_club[club_name]
    story.append(Paragraph(f"▸ {club_name}", club_style))
    story.append(Paragraph(
        f"<font color='#6B7280'>{len(rows)} gardien(s) détecté(s) • {rows[0]['matches_trouves']} matchs analysés</font>",
        ParagraphStyle("meta", fontSize=8, fontName="Helvetica", spaceAfter=6),
    ))
    story.append(build_club_table(rows))
    story.append(Spacer(1, 0.6*cm))

doc.build(story)
print(f"PDF généré : {OUT_PDF}")
