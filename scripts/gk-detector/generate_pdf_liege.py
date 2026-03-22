"""
Rapport Gardiens de But — Province de Liège
Fusionne results CSV + Membre LIEGE.csv pour un rapport PDF professionnel.
"""
import csv
import math
import os
import sys
from collections import defaultdict
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    FrameBreak,
    HRFlowable,
    Image,
    NextPageTemplate,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    Frame,
    PageTemplate,
    BaseDocTemplate,
    KeepTogether,
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas as pdfcanvas

# ── Paths ──────────────────────────────────────────────────────────────────────
RESULTS = sys.argv[1] if len(sys.argv) > 1 else "output/results_20260321_193216.csv"
MEMBRES = sys.argv[2] if len(sys.argv) > 2 else "/Users/jeremydevriendt/Downloads/Membre LIEGE.csv"
OUT_PDF = sys.argv[3] if len(sys.argv) > 3 else "output/gardiens_liege_rapport.pdf"

TODAY   = date.today()

# ── Color Palette (Aureak Design System) ───────────────────────────────────────
GOLD        = colors.HexColor("#C9A84C")
GOLD_LIGHT  = colors.HexColor("#F0E4BC")
DARK        = colors.HexColor("#1A1A2E")
DARK_SOFT   = colors.HexColor("#2D2D45")
WHITE       = colors.white
BEIGE       = colors.HexColor("#F3EFE7")
BEIGE_DARK  = colors.HexColor("#E8E0D0")
GREEN       = colors.HexColor("#10B981")
GREEN_BG    = colors.HexColor("#D1FAE5")
ORANGE      = colors.HexColor("#F59E0B")
ORANGE_BG   = colors.HexColor("#FEF3C7")
RED         = colors.HexColor("#E05252")
RED_BG      = colors.HexColor("#FEE2E2")
GREY        = colors.HexColor("#6B7280")
GREY_LIGHT  = colors.HexColor("#9CA3AF")
BLUE        = colors.HexColor("#3B82F6")
DIVIDER     = colors.HexColor("#D1C4A0")


# ── Data Loading ───────────────────────────────────────────────────────────────
def load_csv(path, enc="utf-8-sig", sep=";"):
    with open(path, encoding=enc, errors="replace") as f:
        return list(csv.DictReader(f, delimiter=sep))

def strip_keys(rows):
    return [{k.strip(): (v.strip() if v else "") for k, v in r.items()} for r in rows]

results = strip_keys(load_csv(RESULTS))
membres = strip_keys(load_csv(MEMBRES, enc="latin-1"))

membres_idx = {r["numaffil"]: r for r in membres if r.get("numaffil")}
gardiens    = [r for r in results if r["statut_final"] == "gardien"]
by_club     = defaultdict(list)
for g in gardiens:
    by_club[g["club"]].append(g)

print(f"✓ {len(gardiens)} gardiens dans {len(by_club)} clubs")


# ── Helpers ────────────────────────────────────────────────────────────────────
def parse_dob(s):
    """Parse M/D/YY or M/D/YYYY → date object, or None."""
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y"):
        try:
            d = datetime.strptime(s.strip(), fmt).date()
            # Fix 2-digit year: 59 → 1959
            if d.year > TODAY.year:
                d = d.replace(year=d.year - 100)
            return d
        except ValueError:
            pass
    return None

def age_from_dob(dob_str):
    d = parse_dob(dob_str)
    if not d:
        return None
    age = TODAY.year - d.year - ((TODAY.month, TODAY.day) < (d.month, d.day))
    return age

def fmt_dob(dob_str):
    d = parse_dob(dob_str)
    if not d:
        return "—"
    return d.strftime("%d/%m/%Y")

def gk_pct(g):
    total = int(g.get("apparitions_total") or 0)
    gk    = int(g.get("apparitions_GK") or 0)
    return (gk / total * 100) if total > 0 else 0

def conf_color(conf):
    return {"haute": GREEN, "moyenne": ORANGE, "faible": RED}.get(conf, GREY)

def conf_bg(conf):
    return {"haute": GREEN_BG, "moyenne": ORANGE_BG, "faible": RED_BG}.get(conf, BEIGE)

def conf_label(conf):
    return {"haute": "HAUTE", "moyenne": "MOYENNE", "faible": "FAIBLE"}.get(conf, conf.upper())

def sexe_label(s):
    return {"H": "♂ Homme", "F": "♀ Femme"}.get(s.strip().upper(), "—")


# ── Styles ─────────────────────────────────────────────────────────────────────
P = lambda text, **kw: Paragraph(text, ParagraphStyle("_", **kw))

cover_title = ParagraphStyle(
    "ct", fontSize=34, fontName="Helvetica-Bold",
    textColor=WHITE, alignment=TA_CENTER, leading=40, spaceAfter=6,
)
cover_sub = ParagraphStyle(
    "cs", fontSize=14, fontName="Helvetica",
    textColor=GOLD, alignment=TA_CENTER, spaceAfter=4, leading=18,
)
cover_info = ParagraphStyle(
    "ci", fontSize=10, fontName="Helvetica",
    textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER, spaceAfter=2,
)
section_title = ParagraphStyle(
    "st", fontSize=16, fontName="Helvetica-Bold",
    textColor=DARK, spaceBefore=0, spaceAfter=4,
)
club_header = ParagraphStyle(
    "ch", fontSize=13, fontName="Helvetica-Bold",
    textColor=WHITE, spaceBefore=0, spaceAfter=0,
)
club_meta = ParagraphStyle(
    "cm_", fontSize=8, fontName="Helvetica",
    textColor=GOLD_LIGHT, spaceBefore=0, spaceAfter=0,
)
tbl_header = ParagraphStyle(
    "th", fontSize=8, fontName="Helvetica-Bold",
    textColor=GOLD, alignment=TA_CENTER,
)
cell_name = ParagraphStyle(
    "cn", fontSize=9, fontName="Helvetica-Bold",
    textColor=DARK, leading=12,
)
cell_sub = ParagraphStyle(
    "csb", fontSize=7.5, fontName="Helvetica",
    textColor=GREY, leading=10,
)
cell_center = ParagraphStyle(
    "cc", fontSize=8, fontName="Helvetica",
    textColor=DARK, alignment=TA_CENTER, leading=11,
)
cell_bold_center = ParagraphStyle(
    "cbc", fontSize=9, fontName="Helvetica-Bold",
    textColor=DARK, alignment=TA_CENTER,
)
cell_small = ParagraphStyle(
    "csm", fontSize=7, fontName="Helvetica",
    textColor=GREY, leading=10,
)
footer_style = ParagraphStyle(
    "fs", fontSize=7, fontName="Helvetica",
    textColor=GREY_LIGHT, alignment=TA_CENTER,
)


# ── Custom Flowables ───────────────────────────────────────────────────────────
class GKBar(Flowable):
    """Mini horizontal progress bar showing GK% of total appearances."""
    def __init__(self, pct, width=2.8*cm, height=6):
        super().__init__()
        self.pct   = min(pct, 100)
        self.width  = width
        self.height = height

    def draw(self):
        c = self.canv
        # Background
        c.setFillColor(BEIGE_DARK)
        c.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)
        # Fill
        fill_w = max(self.width * self.pct / 100, 0)
        if fill_w > 0:
            col = GREEN if self.pct >= 50 else (ORANGE if self.pct >= 20 else RED)
            c.setFillColor(col)
            c.roundRect(0, 0, fill_w, self.height, 2, fill=1, stroke=0)
        # Text
        c.setFont("Helvetica-Bold", 5.5)
        c.setFillColor(DARK)
        c.drawCentredString(self.width / 2, 1.2, f"{self.pct:.0f}%")


class ConfBadge(Flowable):
    """Colored confidence badge pill."""
    def __init__(self, conf, width=2.2*cm, height=14):
        super().__init__()
        self.conf   = conf
        self.width  = width
        self.height = height

    def draw(self):
        c   = self.canv
        bg  = conf_bg(self.conf)
        fg  = conf_color(self.conf)
        lbl = conf_label(self.conf)
        c.setFillColor(bg)
        c.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        c.setFillColor(fg)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(self.width / 2, 3.5, lbl)


class ClubBanner(Flowable):
    """Full-width dark banner for club sections."""
    def __init__(self, club_name, count, matches, page_width, margin):
        super().__init__()
        self.club_name  = club_name
        self.count      = count
        self.matches    = matches
        self.width      = page_width - 2 * margin
        self.height     = 1.1 * cm

    def draw(self):
        c = self.canv
        # Background
        c.setFillColor(DARK)
        c.roundRect(0, 0, self.width, self.height, 5, fill=1, stroke=0)
        # Gold left accent
        c.setFillColor(GOLD)
        c.rect(0, 0, 4, self.height, fill=1, stroke=0)
        # Club name
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(14, self.height / 2 + 2, self.club_name)
        # Meta right
        meta = f"{self.count} gardien(s)  •  {self.matches} matchs analysés"
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 8)
        c.drawRightString(self.width - 10, self.height / 2 - 2, meta)


# ── Page decorators ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = landscape(A4)
MARGIN = 1.5 * cm

def draw_page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GREY_LIGHT)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(MARGIN, 0.7 * cm,
        f"Rapport Gardiens de But — Province de Liège — Saison 2025/2026")
    canvas.drawRightString(PAGE_W - MARGIN, 0.7 * cm,
        f"Page {doc.page}  •  Généré le {TODAY.strftime('%d/%m/%Y')}  •  Aureak")
    canvas.setStrokeColor(DIVIDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 1.0 * cm, PAGE_W - MARGIN, 1.0 * cm)
    canvas.restoreState()

def draw_cover(canvas, doc):
    canvas.saveState()
    # Full dark background
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Gold stripe top
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 4, PAGE_W, 4, fill=1, stroke=0)
    # Gold stripe bottom
    canvas.rect(0, 0, PAGE_W, 4, fill=1, stroke=0)
    canvas.restoreState()

def draw_normal(canvas, doc):
    canvas.saveState()
    # Light background
    canvas.setFillColor(BEIGE)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Top gold accent
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 3, PAGE_W, 3, fill=1, stroke=0)
    canvas.restoreState()
    draw_page_footer(canvas, doc)


# ── Cover Stats ────────────────────────────────────────────────────────────────
conf_counts = {"haute": 0, "moyenne": 0, "faible": 0}
total_gk_apps = 0
for g in gardiens:
    conf_counts[g.get("confiance", "faible")] = conf_counts.get(g.get("confiance", "faible"), 0) + 1
    total_gk_apps += int(g.get("apparitions_GK") or 0)
avg_gk = total_gk_apps / len(gardiens) if gardiens else 0

top5_clubs = sorted(by_club.items(), key=lambda x: len(x[1]), reverse=True)[:5]


# ── Build Document ─────────────────────────────────────────────────────────────
doc = BaseDocTemplate(
    OUT_PDF,
    pagesize=landscape(A4),
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=1.8 * cm,
)

cover_frame  = Frame(0, 0, PAGE_W, PAGE_H, id="cover",
                     leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, showBoundary=0)
normal_frame = Frame(MARGIN, 1.8*cm, PAGE_W - 2*MARGIN, PAGE_H - MARGIN - 1.8*cm, id="main",
                     leftPadding=0, rightPadding=0, topPadding=6, bottomPadding=0, showBoundary=0)

doc.addPageTemplates([
    PageTemplate(id="Cover",  frames=[cover_frame],  onPage=draw_cover),
    PageTemplate(id="Normal", frames=[normal_frame], onPage=draw_normal),
])

story = []

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1 — COVER
# ─────────────────────────────────────────────────────────────────────────────
story.append(Spacer(1, 3.5 * cm))
story.append(Paragraph("🥅 RAPPORT GARDIENS DE BUT", cover_title))
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph("Province de Liège — Saison 2025 / 2026", cover_sub))
story.append(Spacer(1, 0.2 * cm))
story.append(HRFlowable(width="60%", thickness=1.5, color=GOLD, spaceAfter=20, hAlign="CENTER"))
story.append(Spacer(1, 0.5 * cm))

# Big stats row
stats_data = [[
    Paragraph(f"<b><font size=28 color='#C9A84C'>{len(gardiens)}</font></b><br/>"
              f"<font size=10 color='#CBD5E1'>Gardiens détectés</font>", ParagraphStyle("sc", alignment=TA_CENTER, leading=32)),
    Paragraph(f"<b><font size=28 color='#C9A84C'>{len(by_club)}</font></b><br/>"
              f"<font size=10 color='#CBD5E1'>Clubs concernés</font>", ParagraphStyle("sc2", alignment=TA_CENTER, leading=32)),
    Paragraph(f"<b><font size=28 color='#10B981'>{conf_counts['haute']}</font></b><br/>"
              f"<font size=10 color='#CBD5E1'>Confiance haute</font>", ParagraphStyle("sc3", alignment=TA_CENTER, leading=32)),
    Paragraph(f"<b><font size=28 color='#F59E0B'>{conf_counts['moyenne']}</font></b><br/>"
              f"<font size=10 color='#CBD5E1'>Confiance moyenne</font>", ParagraphStyle("sc4", alignment=TA_CENTER, leading=32)),
    Paragraph(f"<b><font size=28 color='#C9A84C'>{avg_gk:.1f}</font></b><br/>"
              f"<font size=10 color='#CBD5E1'>Moy. apparis. GK</font>", ParagraphStyle("sc5", alignment=TA_CENTER, leading=32)),
]]
stats_tbl = Table(stats_data, colWidths=[PAGE_W / 5] * 5, rowHeights=[2.2 * cm])
stats_tbl.setStyle(TableStyle([
    ("VALIGN",   (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN",    (0,0), (-1,-1), "CENTER"),
    ("LINEAFTER",(0,0), (3,-1), 0.5, colors.HexColor("#2D2D45")),
]))
story.append(stats_tbl)
story.append(Spacer(1, 0.8 * cm))
story.append(HRFlowable(width="80%", thickness=0.5, color=colors.HexColor("#2D2D45"), spaceAfter=16, hAlign="CENTER"))

# Top 5 clubs preview
story.append(Paragraph(
    "<font color='#9CA3AF' size=9>TOP 5 CLUBS PAR NOMBRE DE GARDIENS</font>",
    ParagraphStyle("top5lbl", alignment=TA_CENTER, spaceAfter=8),
))
top5_row = [[
    Paragraph(
        f"<b><font color='#C9A84C'>{name}</font></b><br/>"
        f"<font size=8 color='#9CA3AF'>{len(rows)} gardien(s)</font>",
        ParagraphStyle(f"t5_{i}", alignment=TA_CENTER, leading=14),
    )
    for i, (name, rows) in enumerate(top5_clubs)
]]
top5_tbl = Table(top5_row, colWidths=[PAGE_W * 0.16] * 5)
top5_tbl.setStyle(TableStyle([
    ("VALIGN",   (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN",    (0,0), (-1,-1), "CENTER"),
]))
story.append(top5_tbl)

story.append(Spacer(1, 1.5 * cm))
story.append(Paragraph(
    f"<font color='#6B7280' size=8>Généré le {TODAY.strftime('%d %B %Y')} · Données RBFA · Source: Aureak</font>",
    ParagraphStyle("gen", alignment=TA_CENTER),
))

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2 — SOMMAIRE
# ─────────────────────────────────────────────────────────────────────────────
story.append(NextPageTemplate("Normal"))
story.append(PageBreak())

story.append(Paragraph("Sommaire — Clubs & Gardiens", section_title))
story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=10))
story.append(Spacer(1, 0.2 * cm))

# Build flat summary table (splits naturally across pages)
sorted_clubs = sorted(by_club.items(), key=lambda x: x[0])

_SUMM_HEADER = [
    Paragraph("Club", ParagraphStyle("sh", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD)),
    Paragraph("Gardiens", ParagraphStyle("sh2", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD, alignment=TA_CENTER)),
    Paragraph("Confiance haute", ParagraphStyle("sh3", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD, alignment=TA_CENTER)),
    Paragraph("Confiance moy.", ParagraphStyle("sh4", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD, alignment=TA_CENTER)),
    Paragraph("Top gardien", ParagraphStyle("sh5", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD)),
    Paragraph("Matchs analysés", ParagraphStyle("sh6", fontSize=8, fontName="Helvetica-Bold", textColor=GOLD, alignment=TA_CENTER)),
]
_SUMM_COLS = [9.5*cm, 2.0*cm, 2.5*cm, 2.5*cm, 6.5*cm, 2.5*cm]

_summ_rows = [_SUMM_HEADER]
for name, g_list in sorted_clubs:
    top = max(g_list, key=lambda x: int(x["apparitions_GK"] or 0))
    top_str = f"{top['prenom']} {top['nom']} ({top['apparitions_GK']} GK)"
    haute = sum(1 for g in g_list if g["confiance"] == "haute")
    moy   = sum(1 for g in g_list if g["confiance"] == "moyenne")
    _summ_rows.append([
        Paragraph(f"<b>{name}</b>", ParagraphStyle(f"sn_{name[:8]}", fontSize=8, fontName="Helvetica-Bold", textColor=DARK)),
        Paragraph(str(len(g_list)), ParagraphStyle("sc_", fontSize=9, fontName="Helvetica-Bold", textColor=GOLD, alignment=TA_CENTER)),
        Paragraph(f"<font color='#10B981'>● {haute}</font>" if haute else "—", ParagraphStyle("shh", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph(f"<font color='#F59E0B'>● {moy}</font>" if moy else "—", ParagraphStyle("smm", fontSize=8, fontName="Helvetica-Bold", alignment=TA_CENTER)),
        Paragraph(top_str, ParagraphStyle("stp", fontSize=7.5, fontName="Helvetica", textColor=GREY)),
        Paragraph(top["matches_trouves"], ParagraphStyle("smt", fontSize=8, fontName="Helvetica", textColor=GREY, alignment=TA_CENTER)),
    ])

summ_tbl = Table(_summ_rows, colWidths=_SUMM_COLS, repeatRows=1)
summ_tbl.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), DARK),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BEIGE]),
    ("GRID",          (0,0), (-1,-1), 0.3, DIVIDER),
    ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ("RIGHTPADDING",  (0,0), (-1,-1), 6),
    ("TOPPADDING",    (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ("BACKGROUND",    (1,1), (1,-1), colors.HexColor("#FFF7E6")),
]))
story.append(summ_tbl)

# ─────────────────────────────────────────────────────────────────────────────
# PAGES SUIVANTES — UN CLUB PAR SECTION
# ─────────────────────────────────────────────────────────────────────────────
story.append(PageBreak())

COL_WIDTHS = [3.4*cm, 1.9*cm, 1.7*cm, 1.2*cm, 4.6*cm, 3.8*cm, 1.5*cm, 1.4*cm, 1.4*cm, 2.8*cm, 2.0*cm]
HEADERS = [
    Paragraph("Joueur", tbl_header),
    Paragraph("N° Affil.", tbl_header),
    Paragraph("Date nais.", tbl_header),
    Paragraph("Âge", tbl_header),
    Paragraph("Adresse", tbl_header),
    Paragraph("Email", tbl_header),
    Paragraph("Sexe", tbl_header),
    Paragraph("GK ●", tbl_header),
    Paragraph("Champ", tbl_header),
    Paragraph("% en GK", tbl_header),
    Paragraph("Confiance", tbl_header),
]

TOTAL_W = sum(COL_WIDTHS)

for club_idx, (club_name, rows) in enumerate(sorted(by_club.items())):
    # Club banner
    banner = ClubBanner(club_name, len(rows), rows[0]["matches_trouves"], PAGE_W, MARGIN)
    story.append(banner)
    story.append(Spacer(1, 0.2 * cm))

    # Build player rows
    tbl_data = [HEADERS]
    for g in sorted(rows, key=lambda x: int(x["apparitions_GK"] or 0), reverse=True):
        m     = membres_idx.get(g["numaffil"], {})
        dob_s = m.get("datenaiss", "")
        age   = age_from_dob(dob_s)
        pct   = gk_pct(g)

        name_cell = Paragraph(
            f"<b>{g['prenom']} {g['nom']}</b>",
            cell_name,
        )
        affil_cell = Paragraph(g["numaffil"], cell_sub)

        dob_cell = Paragraph(fmt_dob(dob_s), cell_sub)
        age_cell = Paragraph(
            f"<b>{age}</b>" if age else "—",
            ParagraphStyle("ac", fontSize=8, fontName="Helvetica-Bold" if age else "Helvetica",
                           textColor=DARK if age else GREY, alignment=TA_CENTER),
        )

        addr_parts = [m.get("adresse", ""), m.get("cdepost", ""), m.get("commune", "")]
        addr = ", ".join(p for p in addr_parts if p) or "—"
        addr_cell = Paragraph(addr, cell_small)

        email_raw = m.get("email", "") or ""
        email_cell = Paragraph(email_raw if email_raw else "—", cell_small)

        sexe_cell = Paragraph(sexe_label(m.get("cdesexe", "")), cell_sub)

        gk_num = int(g.get("apparitions_GK") or 0)
        gk_cell = Paragraph(
            f"<b>{gk_num}</b>",
            ParagraphStyle("gk", fontSize=11, fontName="Helvetica-Bold",
                           textColor=DARK, alignment=TA_CENTER),
        )
        champ_cell = Paragraph(
            g.get("apparitions_champ", "0"),
            ParagraphStyle("ch2", fontSize=8, fontName="Helvetica",
                           textColor=GREY, alignment=TA_CENTER),
        )

        pct_cell = GKBar(pct, width=COL_WIDTHS[9] - 0.4*cm)
        conf_cell = ConfBadge(g.get("confiance", "faible"), width=COL_WIDTHS[10] - 0.4*cm)

        tbl_data.append([
            name_cell, affil_cell, dob_cell, age_cell,
            addr_cell, email_cell, sexe_cell,
            gk_cell, champ_cell, pct_cell, conf_cell,
        ])

    tbl = Table(tbl_data, colWidths=COL_WIDTHS, repeatRows=1)
    tbl.setStyle(TableStyle([
        # Header
        ("BACKGROUND",    (0,0), (-1,0), DARK),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0), 8),
        ("ALIGN",         (0,0), (-1,0), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,0), 6),
        ("BOTTOMPADDING", (0,0), (-1,0), 6),
        # Data rows
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BEIGE]),
        ("GRID",          (0,0), (-1,-1), 0.25, DIVIDER),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
        ("RIGHTPADDING",  (0,0), (-1,-1), 4),
        ("TOPPADDING",    (0,1), (-1,-1), 5),
        ("BOTTOMPADDING", (0,1), (-1,-1), 5),
        # GK column highlight
        ("BACKGROUND",    (7,1), (7,-1), colors.HexColor("#FFF7E6")),
        ("LINEAFTER",     (7,0), (7,-1), 1.0, GOLD),
        ("LINEBEFORE",    (7,0), (7,-1), 1.0, GOLD),
    ]))

    story.append(tbl)
    story.append(Spacer(1, 0.6 * cm))

    # Page break every 3 clubs to avoid overflow (adjust as needed)
    # We'll let reportlab handle natural breaks — just add a small keepTogether hint


# ─────────────────────────────────────────────────────────────────────────────
# LAST PAGE — METHODOLOGIE
# ─────────────────────────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(Paragraph("Méthodologie de détection", section_title))
story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=12))
story.append(Spacer(1, 0.2 * cm))

method_data = [
    ["Niveau de confiance", "Critères", "Interprétation"],
    [
        Paragraph("<b><font color='#10B981'>HAUTE</font></b>", ParagraphStyle("mh", alignment=TA_CENTER, fontSize=9, fontName="Helvetica-Bold")),
        "≥ 3 apparitions en position GK, score matching ≥ 0.80",
        "Gardien identifié avec certitude — recommandé pour contact",
    ],
    [
        Paragraph("<b><font color='#F59E0B'>MOYENNE</font></b>", ParagraphStyle("mm", alignment=TA_CENTER, fontSize=9, fontName="Helvetica-Bold")),
        "1–2 apparitions GK ou score matching entre 0.70 et 0.80",
        "Gardien probable — validation manuelle recommandée",
    ],
    [
        Paragraph("<b><font color='#E05252'>FAIBLE</font></b>", ParagraphStyle("mf", alignment=TA_CENTER, fontSize=9, fontName="Helvetica-Bold")),
        "Données insuffisantes ou profils multiples possibles",
        "Ne pas contacter sans vérification préalable",
    ],
]
method_tbl = Table(method_data, colWidths=[3.5*cm, 10*cm, 10*cm])
method_tbl.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), DARK),
    ("TEXTCOLOR",     (0,0), (-1,0), GOLD),
    ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",      (0,0), (-1,-1), 8),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BEIGE]),
    ("GRID",          (0,0), (-1,-1), 0.3, DIVIDER),
    ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ("TOPPADDING",    (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
]))
story.append(method_tbl)

story.append(Spacer(1, 0.8 * cm))
notes = [
    "• Les données de contact (adresse, email) proviennent du listing officiel <b>Membre LIEGE</b> transmis par la province.",
    "• Les apparitions GK sont détectées via l'analyse des feuilles de match RBFA (saison 2025/2026).",
    "• La colonne <b>Champ</b> indique le nombre de matchs en compétition officielle (hors matchs amicaux).",
    "• Le pourcentage affiché dans la barre correspond à : <b>Apparitions GK / Apparitions totales</b>.",
    "• Un joueur peut apparaître dans plusieurs équipes d'un même club (équipe A, B, U21, etc.).",
]
for note in notes:
    story.append(Paragraph(note, ParagraphStyle("note", fontSize=8, fontName="Helvetica",
                                                 textColor=GREY, leading=13, spaceAfter=4)))

story.append(Spacer(1, 1.0 * cm))
story.append(HRFlowable(width="100%", thickness=0.5, color=DIVIDER, spaceAfter=8))
story.append(Paragraph(
    f"Document confidentiel — Usage interne Province de Liège — "
    f"{len(gardiens)} gardiens détectés — Généré le {TODAY.strftime('%d/%m/%Y')} via Aureak",
    ParagraphStyle("disc", fontSize=7, fontName="Helvetica", textColor=GREY_LIGHT, alignment=TA_CENTER),
))

# ─────────────────────────────────────────────────────────────────────────────
doc.build(story)
print(f"✅ PDF généré : {OUT_PDF}")
