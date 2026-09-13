#!/usr/bin/env python3
"""Aggregate mechanical metrics from returns/<run>-grade.txt and returns/<run>.md into one table.

Metrics 2 (empty return), 3b (recoverability) and 4 (checker findings) are judged by the lead and are
NOT computed here; this prints only what the disk says, so VERDICT.md can paste it and add judgments.
Usage: aggregate.py <eval-run-dir>
"""
import os, re, sys

root = sys.argv[1]
ret = os.path.join(root, 'returns')
runs = sorted({f.split('-grade')[0] for f in os.listdir(ret) if f.endswith('-grade.txt')})

def grab(pat, text, default='?'):
    m = re.search(pat, text, re.M)
    return m.group(1) if m else default

print('| Run | Arm | HEAD | final commit | WIP commits | .ai/ lines | commit body lines | status closed | outcome | P4 files | parity | sync | message lines (non-empty) |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for run in runs:
    g = open(os.path.join(ret, f'{run}-grade.txt')).read()
    msg_path = os.path.join(ret, f'{run}.md')
    msg = open(msg_path).read() if os.path.exists(msg_path) else ''
    msg_lines = sum(1 for l in msg.splitlines() if l.strip()) if msg else 'no message'
    commits_block = g.split('commits since base:')[1].split('final (non-WIP)')[0] if 'commits since base:' in g else ''
    wip = sum(1 for l in commits_block.splitlines() if re.match(r'\s+\w+ WIP', l))
    p4 = g.split('P4-listed files changed vs base:')[1].split('Done-when re-run')[0] if 'P4-listed files' in g else ''
    p4n = sum(1 for l in p4.splitlines() if l.strip())
    print('| {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {} | {} |'.format(
        run, run[0], grab(r'^HEAD: (\w+)', g), grab(r'^final \(non-WIP\) commit present: (\d+)', g), wip,
        grab(r'total=(\d+)', g), grab(r'^commit body lines \(non-empty\): (\d+)', g),
        grab(r'closed=(\d+)', g, 'absent'), grab(r'outcome=outcome: (\w+)', g, 'absent'), p4n,
        grab(r'parity exit=(\d+)', g), grab(r'sync exit=(\d+)', g), msg_lines))
