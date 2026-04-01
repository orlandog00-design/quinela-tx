#!/usr/bin/env python3
"""
build_templates.py

Usa template.html para construir todas las páginas HTML del sitio,
poblando el título y el contenido de cada página.
También inyecta los partials de header/footer en los placeholders.

Uso:
  python scripts/build_templates.py
"""
from pathlib import Path
import shutil
import argparse
import sys
import re

ROOT = Path(__file__).resolve().parent.parent
PARTIALS_DIR = ROOT / 'assets' / 'partials'
HEADER_FILE = PARTIALS_DIR / 'header.html'
FOOTER_FILE = PARTIALS_DIR / 'footer.html'
TEMPLATE_FILE = ROOT / 'template.html'

def load_partial(path: Path) -> str:
    """Carga un archivo partial, como header o footer."""
    if not path.exists():
        print(f'Warning: partial no encontrado: {path}', file=sys.stderr)
        return ''
    return path.read_text(encoding='utf-8')

def extract_from_html(html_content: str) -> dict:
    """Extrae el título y el contenido principal de una página HTML."""
    result = {
        'title': '',
        'content': ''
    }
    title_match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    if title_match:
        result['title'] = title_match.group(1).strip()
    
    content_match = re.search(r'<main.*?>(.*?)</main>', html_content, re.IGNORECASE | re.DOTALL)
    if content_match:
        result['content'] = content_match.group(1).strip()

    return result

def main():
    parser = argparse.ArgumentParser(description='Construye páginas HTML usando una plantilla.')
    args = parser.parse_args()

    try:
        template_html = TEMPLATE_FILE.read_text(encoding='utf-8')
    except FileNotFoundError:
        print(f"Error: Archivo de plantilla no encontrado: {TEMPLATE_FILE}", file=sys.stderr)
        sys.exit(1)

    header_html = load_partial(HEADER_FILE)
    footer_html = load_partial(FOOTER_FILE)

    # Inyectar header y footer en la plantilla principal UNA SOLA VEZ
    template_with_partials = template_html.replace('{{header}}', header_html)
    template_with_partials = template_with_partials.replace('{{footer}}', footer_html)

    html_files = [p for p in ROOT.glob('*.html') if p.name not in ['template.html']]
    
    out_dir = ROOT / 'dist'
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    print(f"Generando {len(html_files)} páginas en el directorio '{out_dir}'...")

    for src_path in html_files:
        print(f'Procesando {src_path.name}...')
        page_content_str = src_path.read_text(encoding='utf-8')
        extracted_data = extract_from_html(page_content_str)
        
        if not extracted_data['title'] and not extracted_data['content']:
            print(f"Warning: No se pudo extraer título o contenido de {src_path.name}", file=sys.stderr)

        # Rellenar el contenido y el título de la página en la plantilla ya con partials
        final_html = template_with_partials.replace('{{page_title}}', extracted_data['title'])
        final_html = final_html.replace('{{page_content}}', extracted_data['content'])
        
        target_path = out_dir / src_path.name
        target_path.write_text(final_html, encoding='utf-8')

    assets_src_dir = ROOT / 'assets'
    assets_dest_dir = out_dir / 'assets'
    try:
        shutil.copytree(assets_src_dir, assets_dest_dir)
        print(f"\nCopiando directorio de assets a '{assets_dest_dir}'...")
    except Exception as e:
        print(f"Error copiando el directorio de assets: {e}", file=sys.stderr)

    print('\n¡Hecho!')
    print('Las páginas del sitio se han generado en el directorio /dist.')
    print('Para ver los cambios, abre los archivos de /dist en tu navegador.')

if __name__ == '__main__':
    main()
