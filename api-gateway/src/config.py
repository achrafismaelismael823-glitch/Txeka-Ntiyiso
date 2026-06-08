import re


def clean_config(content: str) -> str:
    """
    Cleaner seguro para ficheiros de configuração.
    NÃO remove lógica crítica.
    Apenas normaliza estrutura e branding.
    """

    # 1. Normalização de branding
    content = content.replace("DocVerify MZ", "TXEKA NTIYISO")

    # 2. Remover comentários decorativos vazios ou redundantes
    def is_meaningless_comment(block: str) -> bool:
        clean = block.strip()

        # comentário vazio ou só decoração
        if len(clean) < 5:
            return True

        if "====" in clean or "----" in clean:
            return True

        return False

    def handle_block(match):
        block = match.group(0)
        return "" if is_meaningless_comment(block) else block

    content = re.sub(r'"""(.*?)"""', handle_block, content, flags=re.DOTALL)

    # 3. Limpeza de espaços
    content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
    content = re.sub(r'\n\s*\n+', '\n\n', content)

    return content


# 📂 USO
if __name__ == "__main__":
    with open("input.py", "r", encoding="utf-8") as f:
        code = f.read()

    cleaned = clean_config(code)

    with open("output.py", "w", encoding="utf-8") as f:
        f.write(cleaned)

    print("Done TXEKA NTIYISO Config Cleaner aplicado (safe mode)")
