from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "StoriesLens_Yu_training_update_2026-09-19.docx"

GREEN = "0F6B4A"
LIGHT_GREEN = "EAF4EE"
PALE_GREEN = "F5FAF7"
GOLD = "D6A94A"
GRAY = "666B67"
LIGHT_GRAY = "E6E8E6"
BLACK = "111715"


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def set_cell_text(cell, text, *, bold=False, color=BLACK, size=8.6):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    set_run_font(run, "STHeiti")
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell)


def set_run_font(run, east_asia="STHeiti", latin="Aptos"):
    # Use a CJK-capable font for every script so LibreOffice and Word render
    # mixed Chinese/English runs consistently instead of showing tofu boxes.
    run.font.name = east_asia
    run._element.rPr.rFonts.set(qn("w:ascii"), east_asia)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), east_asia)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), east_asia)


def style_document(doc):
    sec = doc.sections[0]
    sec.top_margin = Inches(0.7)
    sec.bottom_margin = Inches(0.65)
    sec.left_margin = Inches(0.72)
    sec.right_margin = Inches(0.72)
    sec.header_distance = Inches(0.25)
    sec.footer_distance = Inches(0.28)

    normal = doc.styles["Normal"]
    normal.font.name = "STHeiti"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "STHeiti")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "STHeiti")
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "STHeiti")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(BLACK)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.2

    for style_name, size, before, after in (
        ("Title", 28, 0, 16),
        ("Heading 1", 18, 14, 7),
        ("Heading 2", 13.5, 10, 4),
        ("Heading 3", 11.5, 7, 3),
    ):
        st = doc.styles[style_name]
        st.font.name = "STHeiti"
        st._element.rPr.rFonts.set(qn("w:ascii"), "STHeiti")
        st._element.rPr.rFonts.set(qn("w:hAnsi"), "STHeiti")
        st._element.rPr.rFonts.set(qn("w:eastAsia"), "STHeiti")
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = RGBColor.from_string(BLACK)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True


def add_top_rule(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(14)
    p_pr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "20")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), GREEN)
    pbdr.append(bottom)
    p_pr.append(pbdr)


def add_footer(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("StoriesLens · 羽大师知识库训练更新记录   |   ")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor.from_string(GRAY)
    set_run_font(run)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    p._p.append(fld)


def add_para(doc, text="", *, bold=False, color=BLACK, size=None, align=None, keep=False):
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    p.paragraph_format.keep_together = keep
    run = p.add_run(text)
    run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    if size:
        run.font.size = Pt(size)
    set_run_font(run)
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.left_indent = Inches(0.22 + 0.22 * level)
    p.paragraph_format.first_line_indent = Inches(-0.16)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    set_run_font(run)
    return p


def add_number(doc, text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.left_indent = Inches(0.24)
    p.paragraph_format.first_line_indent = Inches(-0.16)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    set_run_font(run)
    return p


def add_key_value_table(doc, rows):
    table = doc.add_table(rows=0, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(1.55)
    table.columns[1].width = Inches(5.25)
    for i, (key, value) in enumerate(rows):
        cells = table.add_row().cells
        set_cell_text(cells[0], key, bold=True, color=GREEN, size=9)
        set_cell_text(cells[1], value, size=9.1)
        set_cell_shading(cells[0], LIGHT_GREEN)
        set_cell_shading(cells[1], "FFFFFF" if i % 2 == 0 else PALE_GREEN)
    return table


def add_source_table(doc):
    rows = [
        ("09-13", "IES/WWC 小学写作指南", "美国联邦公共领域", "写作过程、目的与受众、句子流畅度、反馈与发表"),
        ("09-13", "IES/WWC 中学写作指南", "美国联邦公共领域", "Model–Practice–Reflect、读写整合、形成性评价"),
        ("09-13", "刘勰《文心雕龙》", "原作公有领域；仅存自写抽象", "构思、情采、篇章剪裁、读者视角"),
        ("09-15", "IES/WWC 英语学习者指南", "美国联邦公共领域", "口述/视觉组织到书面表达；逐步撤除支架"),
        ("09-15", "王国维《人间词话》", "公有领域；仅存自写抽象", "内外视角、具体变化、虚构逻辑、关键词选择"),
        ("09-18", "Writing the Photoplay", "Project Gutenberg 标记美国公有领域", "可见行动、场景变化、下一步因果"),
        ("09-18", "袁枚《随园诗话》", "公有领域；仅存自写抽象", "延时重读、一次一改、方案比较、保留声音"),
    ]
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    widths = [0.58, 1.75, 1.62, 2.85]
    headers = ["日期", "采用来源", "权利状态", "新增能力"]
    for i, (cell, text) in enumerate(zip(table.rows[0].cells, headers)):
        cell.width = Inches(widths[i])
        set_cell_text(cell, text, bold=True, color="FFFFFF", size=8.8)
        set_cell_shading(cell, GREEN)
    set_repeat_table_header(table.rows[0])
    for r_i, row in enumerate(rows):
        cells = table.add_row().cells
        for i, (cell, text) in enumerate(zip(cells, row)):
            cell.width = Inches(widths[i])
            set_cell_text(cell, text, size=8.15 if i != 3 else 8.0)
            set_cell_shading(cell, "FFFFFF" if r_i % 2 == 0 else PALE_GREEN)
    return table


def add_module(doc, name, source, ages, objective, methods, questions, boundaries):
    doc.add_heading(name, level=2)
    p = add_para(doc, f"来源：{source}　｜　适用：{ages}", color=GRAY, size=9.2, keep=True)
    p.paragraph_format.space_after = Pt(4)
    add_para(doc, f"教学目标：{objective}", bold=True)
    for item in methods:
        add_bullet(doc, item)
    add_para(doc, "Yu 可使用的原创追问：", bold=True, color=GREEN)
    for q in questions:
        add_bullet(doc, f"“{q}”", level=1)
    add_para(doc, f"边界：{boundaries}", color=GRAY, size=9.2)


def page_break(doc):
    # Let Word paginate naturally. Hard breaks produced nearly empty pages when
    # a preceding module happened to finish close to a page boundary.
    return None


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()
    style_document(doc)
    for section in doc.sections:
        add_footer(section)

    add_top_rule(doc)
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run("StoriesLens 羽大师\n知识库训练更新记录")
    set_run_font(r)
    r.font.color.rgb = RGBColor.from_string(BLACK)

    add_para(doc, "2026 年 9 月 13 日—9 月 19 日", bold=True, color=GREEN, size=13)
    add_para(doc, "内部存档 · 可审查版本", color=GRAY, size=9.5)
    add_para(
        doc,
        "本文件汇总最近四次 Yu（羽大师）中英文写作导师知识库增量训练，记录来源、许可、教学转化、年龄分层、安全边界与验证结果。它不是来源原文汇编，也不构成任何机构对 StoriesLens 的认可。",
        size=11.2,
    )

    doc.add_heading("核心结论", level=1)
    add_key_value_table(doc, [
        ("采用来源", "7 项经过权利核查的高可信来源：3 项英文机构/历史资料，4 项中文与跨语种原典或指南。"),
        ("形成模块", "6 个结构化教学模块，覆盖写作循环、多语支架、视觉行动、构思剪裁、境界视角与修改距离。"),
        ("低龄保护", "8–12 岁只使用轻量、可选、每轮一次的视觉行动问题；不使用电影术语，也不替写句子。"),
        ("版权边界", "不保存受版权保护的长篇原文、来源例句或评测项目；只保存 StoriesLens 独立撰写的方法与追问。"),
        ("验证结果", "截至 2026-09-19，完整自动化测试 96/96 通过；包含语言隔离、年龄路由、版权状态与不代写边界。"),
    ])

    doc.add_heading("1. 更新原则", level=1)
    for item in [
        "先核实机构或作者、原始网址、发布日期、许可依据、语言、年龄段、能力领域与可信度，再决定是否采用。",
        "只提炼可教学的方法、评价维度与原创追问，不复制教材、课程标准正文、来源例句或长篇段落。",
        "Yu 每轮只教一个高价值能力：先肯定真实优点，再指出一个优先改进点，然后由创作者亲自完成修改。",
        "中英文分别路由；年龄、创作水平和多语背景决定支架强度，不能把语言差异当作缺陷。",
        "不声称获得 IES、WWC、CCSS、中国教育部、NWEA、MAP、Project Gutenberg 或任何作者的官方认可。",
    ]:
        add_bullet(doc, item)

    doc.add_heading("2. 本轮采用来源总表", level=1)
    add_source_table(doc)
    add_para(doc, "说明：表中的“采用”指采用 StoriesLens 独立撰写的教学抽象，不等于导入或复制来源正文。", color=GRAY, size=8.8)

    page_break(doc)
    doc.add_heading("3. 英文新增训练能力", level=1)
    add_module(
        doc,
        "3.1 Evidence-based writing cycle · 循证写作循环",
        "IES/WWC 小学与中学写作实践指南",
        "小学至高中；按年龄简化",
        "把写作从一次性交稿变成可反复练习、反馈和反思的过程。",
        [
            "先确定这一次写作的目的与读者，再选择一个最需要练习的策略。",
            "采用 Model–Practice–Reflect：看见方法、亲自尝试、回看效果。",
            "形成性反馈只指出最值得改的一项，避免一次纠正所有问题。",
            "让创作者解释为什么保留或修改，从而形成可迁移的写作判断。",
        ],
        [
            "Who do you want to read this, and what should they feel or understand?",
            "Which one part would make the biggest difference if we improved it now?",
            "What did your revision change for the reader?",
        ],
        "不复制指南范例；不把证据等级不同的建议说成同样确定；不代替学生完成全文。",
    )
    add_module(
        doc,
        "3.2 Multilingual written language · 多语创作者支架",
        "IES/WWC English Learners practice guide（2014）",
        "小学与初中多语学习者；仅在需要时启用",
        "先保护故事想法，再支持学习者把口述或视觉关系转成可修改的书面表达。",
        [
            "把语言学习目标与故事创作目标分开，避免语法纠错遮住创意。",
            "允许先口述、画关系图或排序图片，再进入书面表达。",
            "只教完成当前表达所需的少量词语或结构。",
            "提供空白组织器、关系选择或留空框架，使用后逐步撤除支架。",
        ],
        [
            "Would you like to say it first, draw the order, or write one short line?",
            "Which word do you need to make your meaning clear?",
            "Can you say the idea again in your own words without the frame?",
        ],
        "不生成可直接粘贴的完整故事句；不因口音或语法差异降低对创意的评价。",
    )
    add_module(
        doc,
        "3.3 Visual screenwriting action · 可见行动与场景变化",
        "Writing the Photoplay（1913，Project Gutenberg）",
        "13 岁以上完整模式；8–12 岁轻量模式",
        "帮助创作者区分解释与观众真正能看见或听见的行动，并检查场景是否发生变化。",
        [
            "每次只找一个可见或可听的行动，不把所有情绪都强行转换成动作。",
            "检查本场是否出现选择、发现、逆转、到达、失去或新障碍。",
            "检查一个动作是否自然导致下一拍，并让创作者确认仍是自己的意思。",
            "8–12 岁模式只问一句普通问题，不出现 scene beat、filmable 等术语。",
        ],
        [
            "What can we see or hear your character do?",
            "What changes in this moment?",
            "Does this action make the next moment happen?",
        ],
        "不教授默片时代格式、市场规则、性别假设或过时审查标准；不把历史资料当现代制片规范。",
    )

    page_break(doc)
    doc.add_heading("4. 中文新增训练能力", level=1)
    add_module(
        doc,
        "4.1 古典创作工艺与现代修改",
        "刘勰《文心雕龙》：神思、情采、镕裁、知音",
        "中学、高中、成人；低龄只用具体问题",
        "把构思、材料、语言、篇章剪裁与读者感受连接起来。",
        [
            "先确定真正想表达的情意，再选择能承载它的材料。",
            "文采必须服务内容，不为华丽而堆砌。",
            "修改时依次检查纲领、次序、重复与删减后的意义完整。",
            "暂时站到读者位置，先辨文体与意图，再判断语言效果。",
        ],
        [
            "这段最想让读者记住的意思是什么？",
            "哪一个细节真正服务这个意思？",
            "删掉哪一句以后，意思反而更清楚？",
            "第一次读到这里的人会在哪里停住或误解？",
        ],
        "不要求模仿古文，不把古典审美当作唯一标准，不复制原典与现代校勘注释。",
    )
    add_module(
        doc,
        "4.2 境界与视角距离",
        "王国维《人间词话》（1926）",
        "中学、高中、成人；低龄不使用术语",
        "帮助创作者在人物内心与读者观察位置之间切换，用具体变化承载情绪。",
        [
            "先进入人物内部确认真实感受，再退后检查读者能否看见或理解。",
            "虚构场景可以奇幻，但材料组合要符合故事自身的自然逻辑。",
            "把抽象情绪落到可见、可闻或可触的具体变化，不堆砌景物。",
            "比较一个动作词或关键词如何改变整幅画面。",
        ],
        [
            "如果站在人物心里，这一刻最真实的感受是什么？",
            "如果退后一步看，读者能从哪个细节感受到它？",
            "这个世界里，为什么这件奇幻的事会自然发生？",
            "换掉哪个词，画面会更准确？",
        ],
        "不把“境界”当所有文体的唯一评价标准，不把历史审美转成儿童作品等级。",
    )
    add_module(
        doc,
        "4.3 修改距离与作者声音",
        "袁枚《随园诗话》卷三",
        "中学、高中、成人；小学使用浅层版本",
        "建立“停一下—读一遍—一次解决一个问题—说明为什么改”的修改习惯。",
        [
            "初稿后拉开一点时间距离，再用读者身份朗读。",
            "先判断问题属于不清楚、不准确还是节奏不顺。",
            "每轮只改一个高价值问题，并比较两个可能改法。",
            "修改后复述原意，确认创作者自己的声音仍然存在。",
        ],
        [
            "读到哪里时，你第一次觉得不够清楚？",
            "这是意思不准，还是读起来不顺？",
            "两个改法里，哪一个更像你？为什么？",
            "改完以后，你原来最想说的还在吗？",
        ],
        "不以修改数量衡量进步，不为了华丽而过度修改，不要求模仿古典诗风。",
    )

    page_break(doc)
    doc.add_heading("5. 低龄版特别规则", level=1)
    add_para(doc, "8–12 岁视觉行动轻量模式", bold=True, color=GREEN, size=12)
    add_bullet(doc, "唯一核心问题：What can we see or hear your character do?")
    add_bullet(doc, "每轮最多出现一次，只在真的有助于表达时提出；儿童可以跳过。")
    add_bullet(doc, "不使用“镜头、场景节拍、可拍摄性”等电影术语。")
    add_bullet(doc, "不要求每种情绪都变成动作，也不把内心感受判定为错误。")
    add_bullet(doc, "Yu 不提供完整替代句，只帮助孩子找到自己的动作或声音。")
    add_bullet(doc, "中文路线不显示英文模块名称或英文追问；英文路线同样不混入中文术语。")

    doc.add_heading("6. Yu 的统一辅导流程", level=1)
    steps = [
        "看见亮点：指出一个真实、具体、与作品有关的优点。",
        "选定优先项：从内容、结构、语言或读者体验中只选一个最值得先处理的问题。",
        "微型讲解：用儿童能理解的话解释一个方法，不堆叠术语。",
        "提出一个问题：问题必须让创作者作决定，而不是暗示标准答案。",
        "创作者亲自修改：可以说、写、读或比较，但不能由 Yu 代写成品。",
        "朗读与确认：创作者确认“这是我的意思，也像我的声音”。",
        "留下下一步：记录这次学到的方法，进入下一段或下一章。",
    ]
    for step in steps:
        add_number(doc, step)

    doc.add_heading("7. 语言与能力路由", level=1)
    add_key_value_table(doc, [
        ("English · general", "写作循环、目的与受众、形成性反馈；按年龄调整问题长度。"),
        ("English · multilingual", "增加口述与视觉组织、少量词汇和可撤除支架；不降低创意标准。"),
        ("English · visual story", "13+ 使用完整视觉行动；8–12 使用轻量问题。"),
        ("中文 · 通用", "构思、材料、情意、剪裁、读者视角与朗读修改。"),
        ("中文 · 中高龄", "可选启用境界、视角距离与古典文论的现代化解释。"),
    ])

    page_break(doc)
    doc.add_heading("8. 未采用、隔离或仅作对齐的资料", level=1)
    items = [
        ("OpenStax Writing Guide with Handbook", "拒绝", "虽是高质量 OER，但许可为 CC BY-NC-SA，页面另有禁止未经许可用于 LLM/生成式 AI 训练的说明；未摄取任何内容。"),
        ("CCSS ELA", "仅作外部对齐", "只保留官方链接与能力编号；不导入标准正文、示例或第三方材料，也不声称官方认可。"),
        ("教育部《义务教育语文课程标准（2022年版）》", "隔离", "权威且公开，但未找到明确商业再利用或 AI 知识提炼许可；仅作外部对齐参照。"),
        ("2017 NAEP Writing Framework", "隔离", "未核实到明确再利用或公共领域声明；在权利确认前不进入运行时知识库。"),
        ("陆机《文赋》", "延期", "权利状态合格，但与现有《文心雕龙》构思与剪裁模块重合；避免为凑数量而重复训练。"),
        ("商业写作教材", "隔离", "缺少可核查版本与许可记录；不保存原文，只保留已独立形成且可追溯的方法摘要。"),
    ]
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    widths = [1.9, 0.95, 3.9]
    for i, (cell, text) in enumerate(zip(table.rows[0].cells, ["资料", "状态", "原因与处理"])):
        cell.width = Inches(widths[i])
        set_cell_text(cell, text, bold=True, color="FFFFFF", size=8.8)
        set_cell_shading(cell, GREEN)
    set_repeat_table_header(table.rows[0])
    for r_i, row in enumerate(items):
        cells = table.add_row().cells
        for i, (cell, text) in enumerate(zip(cells, row)):
            cell.width = Inches(widths[i])
            set_cell_text(cell, text, bold=(i == 1), color=GREEN if i == 1 else BLACK, size=8.2)
            set_cell_shading(cell, "FFFFFF" if r_i % 2 == 0 else PALE_GREEN)

    doc.add_heading("9. 验证与安全检查", level=1)
    for item in [
        "所有新增 JSON 模块均通过解析；相关 JavaScript 文件通过语法检查。",
        "完整自动化测试 96/96 通过，0 失败。",
        "来源准入测试要求采用项必须有网址、权利说明、获取日期与可信度。",
        "回归测试确认：多语支架不生成完整故事句；英文视觉行动不进入中文路线；年龄分层按规则启用。",
        "OpenStax、NAEP、中国课程标准与未核实商业教材保持拒绝或隔离，运行时不可调用。",
        "未成年人保护、作者身份、不代写、CCSS/MAP 非背书等既有安全边界继续通过。",
    ]:
        add_bullet(doc, item)

    doc.add_heading("10. 建议继续保留的人工决定", level=1)
    for item in [
        "在获得明确书面许可前，中国课程标准继续只作外部对齐，不把正文、示例或评价语言送入 Yu。",
        "低龄视觉行动保持“可选、一次一个、无术语、不替写”，先用真实儿童测试理解度和挫败感。",
        "每次新增来源继续记录获取日期、许可证据、可信度、适用年龄与未采用内容。",
        "面向家长或教师展示时，用“Yu 每天学习、来源可查、只提炼方法”表述；避免“官方认证”“读完某教材”等误导。",
    ]:
        add_bullet(doc, item)

    page_break(doc)
    doc.add_heading("附录 A · 来源网址", level=1)
    urls = [
        ("IES/WWC 小学写作指南", "https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC_Elem_Writing_PG_Dec182018.pdf"),
        ("IES/WWC 中学写作指南", "https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_secondary_writing_110116.pdf"),
        ("IES/WWC 英语学习者指南", "https://ies.ed.gov/ncee/WWC/PracticeGuide/19/Published"),
        ("《文心雕龙》", "https://zh.wikisource.org/wiki/文心雕龍"),
        ("《人间词话》（1926）", "https://zh.wikisource.org/zh-hant/人間詞話_(1926)"),
        ("Writing the Photoplay", "https://www.gutenberg.org/ebooks/17903"),
        ("《随园诗话》卷三", "https://zh.wikisource.org/zh-hans/随園詩話/03"),
    ]
    for name, url in urls:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        r = p.add_run(f"{name}\n")
        r.bold = True
        r.font.color.rgb = RGBColor.from_string(GREEN)
        set_run_font(r)
        r2 = p.add_run(url)
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGBColor.from_string(GRAY)
        set_run_font(r2)

    doc.add_heading("附录 B · 模块标识", level=1)
    modules = [
        "en/evidence-based-writing-cycle",
        "en/multilingual-written-language",
        "en/visual-screenwriting-action",
        "zh/classical-craft-revision",
        "zh/realm-and-viewpoint",
        "zh/revision-distance",
    ]
    for m in modules:
        add_bullet(doc, m)

    add_para(doc, "编制日期：2026-09-19　｜　依据：StoriesLens 本地来源登记表、结构化模块与运行记录", color=GRAY, size=8.5)

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
