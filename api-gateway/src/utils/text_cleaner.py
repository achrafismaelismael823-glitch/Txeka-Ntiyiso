"""TXEKA NTIYISO Config Cleaner — limpa comentários excessivos."""

import re


def clean_config(content: str) -> str:
    """Remove comentários excessivos, mantém lógica intacta."""

    # 1. Remover docstrings grandes (mais de 3 linhas ou com palavras de "excesso")
    def is_excessive_docstring(block: str) -> bool:
        lines = [l.strip() for l in block.strip().split('\n') if l.strip()]
        
        # Mais de 3 linhas = excessivo
        if len(lines) > 3:
            return True
        
        # Palavras que indicam "excesso de documentação"
        excess_keywords = [
            'Args:', 'Returns:', 'Raises:', 'Example:', 'Notes:',
            'casos de uso', 'contexto', 'regras de segurança',
            'responsabilidades', 'comportamento'
        ]
        block_lower = block.lower()
        return any(kw.lower() in block_lower for kw in excess_keywords)

    def handle_docstring(match):
        block = match.group(1)
        if is_excessive_docstring(block):
            return ''
        # Mantém docstrings curtas (1-3 linhas)
        return match.group(0)

    content = re.sub(r'"""(.*?)"""', handle_docstring, content, flags=re.DOTALL)

    # 2. Remover comentários inline excessivos (mais de 5 palavras)
    def is_excessive_comment(line: str) -> bool:
        # Comentários curtos (até 5 palavras) são mantidos
        words = line.strip().split()
        return len(words) > 6  # "# Audit log" = 3 palavras  | "# Validação do hash — deve ter exatamente 64 caracteres hex" = 9 palavras 

    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('#'):
            if is_excessive_comment(stripped):
                continue  # Remove comentário excessivo
        cleaned_lines.append(line)
    content = '\n'.join(cleaned_lines)

    # 3. Limpeza de espaços
    content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
    content = re.sub(r'\n\s*\n+', '\n\n', content)

    return content


# USO
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Uso: python cleaner.py input.py output.py")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, "r", encoding="utf-8") as f:
        code = f.read()

    cleaned = clean_config(code)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(cleaned)

    print(f"✅ TXEKA NTIYISO Cleaner: {input_file} → {output_file}")
