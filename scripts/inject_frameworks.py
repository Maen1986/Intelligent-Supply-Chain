#!/usr/bin/env python3
"""
inject_frameworks.py
Inserts `frameworks: [...]` into every sub-segment object in
maturitySubSegData1to5.ts, maturitySubSegData6to11.ts, and
every SubSegment in maturityData.tsx.

Run from workspace root:
  python3 scripts/inject_frameworks.py
"""
import re, pathlib

BASE = pathlib.Path('artifacts/i-supply-chain/src/pages')

# ── Framework assignments by segment prefix ──────────────────────────────────

SEGMENT_FRAMEWORKS = {
    'strategy':     ['ASCM/SCOR', 'Gartner', 'IBP'],
    'proc':         ['CIPS', 'ISM/CPSM', 'APICS'],
    'clm':          ['IACCM/WCC', 'ISO 9001', 'CIPS'],
    'srm':          ['CIPS', 'ISO 44001', 'APICS'],
    'risk':         ['ISO 31000', 'CIPS', 'APICS SCOR'],
    'esg':          ['ISO 14001', 'ISO 45001', 'GRI'],
    'digital':      ['Gartner', 'ISO 27001', 'ASCM'],
    'demand':       ['ASCM', 'APICS', 'IBP'],
    'inv':          ['ASCM', 'APICS', 'ABC-XYZ'],
    'logi':         ['CSCMP', 'FIATA', 'Incoterms'],
    'org':          ['CIPS', 'CSCMP', 'SHRM'],
    'mfg':          ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    'fleet':        ['IATA', 'FIATA', 'ISO 28001'],
    'reg':          ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    # maturityData.tsx segment IDs (legacy)
    'procurement':  ['CIPS', 'ISM/CPSM', 'APICS'],
    'contracts':    ['IACCM/WCC', 'ISO 9001', 'CIPS'],
    'suppliers':    ['CIPS', 'ISO 44001', 'APICS'],
    'sustainability':['ISO 14001', 'ISO 45001', 'GRI'],
    'inventory':    ['ASCM', 'APICS', 'ABC-XYZ'],
    'logistics':    ['CSCMP', 'FIATA', 'Incoterms'],
    'org_talent':   ['CIPS', 'CSCMP', 'SHRM'],
    'mfg_ops':      ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    'fleet_ops':    ['IATA', 'FIATA', 'ISO 28001'],
    'regulatory':   ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
}

def get_frameworks_for_id(seg_id: str) -> list[str] | None:
    """Return framework list for a segment/sub-segment id string."""
    for prefix, fws in SEGMENT_FRAMEWORKS.items():
        if seg_id.startswith(prefix):
            return fws
    return None

def fw_line(indent: str, fws: list[str]) -> str:
    items = ', '.join(f"'{f}'" for f in fws)
    return f"{indent}frameworks: [{items}],"

def inject_into_subseg_file(path: pathlib.Path) -> int:
    """
    For maturitySubSegData files: insert `frameworks: [...]` immediately
    before each `    questions: [` line that follows a sub-segment opening.
    Returns number of injections made.
    """
    text = path.read_text()
    lines = text.splitlines(keepends=True)
    out = []
    count = 0
    current_id = None
    already_has_fw = False

    for i, line in enumerate(lines):
        # Track current sub-segment id
        m = re.match(r"^\s+id:\s+'([^']+)'", line)
        if m:
            current_id = m.group(1)
            already_has_fw = False

        # Track if frameworks already present
        if re.match(r'^\s+frameworks:', line):
            already_has_fw = True

        # Inject before `    questions: [`
        if re.match(r"^    questions: \[", line) and current_id and not already_has_fw:
            fws = get_frameworks_for_id(current_id)
            if fws:
                indent = '    '
                out.append(fw_line(indent, fws) + '\n')
                count += 1
                already_has_fw = True

        out.append(line)

    if count:
        path.write_text(''.join(out))
        print(f"  {path.name}: injected {count} frameworks entries")
    else:
        print(f"  {path.name}: nothing to inject (already present or no matches)")
    return count


def inject_into_maturity_data(path: pathlib.Path) -> int:
    """
    For maturityData.tsx SubSegment objects: insert `frameworks: [...]`
    before each `    questions: [` that follows a segment id.
    Returns number of injections.
    """
    return inject_into_subseg_file(path)  # same logic, same indentation pattern


# ── Main ──────────────────────────────────────────────────────────────────────

files = [
    BASE / 'maturitySubSegData1to5.ts',
    BASE / 'maturitySubSegData6to11.ts',
    BASE / 'maturityData.tsx',
]

total = 0
for f in files:
    if not f.exists():
        print(f"  SKIP {f.name} (not found)")
        continue
    total += inject_into_subseg_file(f)

print(f"\nDone. Total injections: {total}")
