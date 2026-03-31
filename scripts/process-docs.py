#!/usr/bin/env python3
"""
process-docs.py
Procesa los PDFs de mechani_ai/, extrae texto con pdftotext,
genera embeddings con Google AI y los guarda en Supabase.
"""

import os, sys, json, time, subprocess, urllib.request, urllib.parse
from pathlib import Path

# ─── Cargar .env.local ────────────────────────────────────────────────────────
env_file = Path('.env.local')
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL  = os.environ.get('VITE_SUPABASE_URL') or os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY  = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
GOOGLE_KEY    = os.environ.get('GOOGLE_AI_API_KEY', '')

if not all([SUPABASE_URL, SUPABASE_KEY, GOOGLE_KEY]):
    print('❌ Faltan variables de entorno: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_AI_API_KEY')
    sys.exit(1)

DOCS_DIR     = Path('./mechani_ai')
CHUNK_SIZE   = 800
CHUNK_OVERLAP = 100
EMBED_DELAY  = 0.2
RESET        = '--reset' in sys.argv

# ─── Helpers ──────────────────────────────────────────────────────────────────

def http_post(url, data, headers):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={**headers, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def get_embedding(text):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GOOGLE_KEY}'
    resp = http_post(url, {'content': {'parts': [{'text': text}]}, 'outputDimensionality': 768}, {})
    return resp['embedding']['values']

def supabase_insert(row):
    url = f'{SUPABASE_URL}/rest/v1/knowledge_base'
    headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}', 'Prefer': 'return=minimal'}
    http_post(url, row, headers)

def supabase_get_processed():
    url = f'{SUPABASE_URL}/rest/v1/knowledge_base?select=metadata&limit=10000'
    req = urllib.request.Request(url, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read())
    return {r['metadata'].get('path') for r in rows if r.get('metadata', {}).get('path')}

def supabase_reset():
    url = f'{SUPABASE_URL}/rest/v1/knowledge_base?id=neq.00000000-0000-0000-0000-000000000000'
    req = urllib.request.Request(url, method='DELETE', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    with urllib.request.urlopen(req, timeout=30): pass

def chunk_text(text):
    chunks, start = [], 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunk = text[start:end].strip()
        if len(chunk) > 50:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - CHUNK_OVERLAP
    return chunks

def extract_text(pdf_path):
    try:
        result = subprocess.run(
            ['pdftotext', str(pdf_path), '-'],
            capture_output=True, text=True, timeout=15
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        raise Exception(f'pdftotext timeout (>15s) — PDF probablemente corrupto o muy complejo')

def get_marca(relative):
    brands = ['RENAULT', 'PEUGEOT', 'VW', 'VOLKSWAGEN', 'FORD', 'FIAT', 'GM', 'CHEVROLET', 'HYUNDAI', 'CITROEN', 'TOYOTA']
    upper = relative.upper()
    return next((b for b in brands if b in upper), 'GENERAL')

# ─── Main ─────────────────────────────────────────────────────────────────────

if RESET:
    print('🗑️  Borrando embeddings existentes...')
    supabase_reset()
    print('✅ Tabla limpia')

processed_paths = supabase_get_processed()
print(f'📋 Ya procesados: {len(processed_paths)} archivos únicos')

all_pdfs = sorted(DOCS_DIR.rglob('*.pdf'))
print(f'📁 PDFs encontrados: {len(all_pdfs)}')

total_chunks = processed_files = skipped_files = error_files = 0

for i, pdf_path in enumerate(all_pdfs):
    relative = str(pdf_path.relative_to(DOCS_DIR))

    if relative in processed_paths:
        skipped_files += 1
        continue

    print(f'\n📄 [{i+1}/{len(all_pdfs)}] {relative}')

    try:
        text = extract_text(pdf_path)
        if len(text) < 100:
            print(f'  ⚠️  Texto insuficiente ({len(text)} chars) — saltando')
            skipped_files += 1
            continue

        print(f'  ✏️  Texto extraído: {len(text)} chars')
        chunks = chunk_text(text)
        print(f'  🔪 Chunks: {len(chunks)}')

        parts = Path(relative).parts
        meta = {
            'filename': pdf_path.stem,
            'path': relative,
            'marca': get_marca(relative),
            'folder': '/'.join(parts[:-1]),
        }

        for j, chunk in enumerate(chunks):
            time.sleep(EMBED_DELAY)
            embedding = get_embedding(chunk)
            supabase_insert({'content': chunk, 'metadata': {**meta, 'chunk': str(j)}, 'embedding': embedding})
            print(f'\r  🧠 {j+1}/{len(chunks)} chunks', end='', flush=True)

        print()
        total_chunks += len(chunks)
        processed_files += 1
        print(f'  ✅ Guardados {len(chunks)} chunks')

    except Exception as e:
        print(f'  ❌ Error: {e}')
        error_files += 1

print('\n─────────────────────────────────────')
print(f'✅ Procesados: {processed_files} archivos')
print(f'⏭️  Saltados:   {skipped_files} (ya existían o sin texto)')
print(f'❌ Errores:    {error_files}')
print(f'📦 Total chunks insertados: {total_chunks}')
