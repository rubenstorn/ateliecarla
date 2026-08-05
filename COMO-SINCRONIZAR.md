# Como trabalhar neste projeto em vários computadores

Guia rápido. Pense no GitHub como o "Google Drive" do projeto: o código
fica no seu computador **e** numa cópia na internet.

Endereço do projeto na internet:
https://github.com/rubenstorn/ateliecarla

---

## A regra de ouro

**`pull` ao abrir. `push` ao fechar.**

Se esquecer o `push`, o outro computador não vê nada do que você fez.

---

## Todo dia, ao COMEÇAR a trabalhar

Abra o terminal na pasta do projeto e rode:

```bash
git pull
```

Isso baixa a última versão. É o "abrir o arquivo atualizado".

---

## Todo dia, ao TERMINAR

```bash
git add -A
git commit -m "escreva aqui o que você mudou"
git push
```

O que cada linha faz:

| Comando | O que faz |
|---|---|
| `git add -A` | separa tudo que mudou |
| `git commit -m "..."` | cria o ponto de restauração no seu PC |
| `git push` | manda para a internet |

O texto entre aspas é só para você lembrar depois. Exemplo:
`git commit -m "ajustei os preços do catálogo"`

---

## Num computador NOVO (só na primeira vez)

**1. Baixar o projeto**

```bash
git clone https://github.com/rubenstorn/ateliecarla.git
```

**2. Dizer ao git quem é você** (sem isso o `commit` dá erro)

```bash
git config --global user.name "Rubens Silva"
```

```bash
git config --global user.email "rubens.silva@texascenter.com.br"
```

Pronto. Daí em diante é só a regra de ouro: `pull` ao abrir, `push` ao
fechar.

---

## Para ver o site rodando

O site precisa de um servidor — abrir o `index.html` com duplo clique
**não funciona** direito, porque o navegador bloqueia a leitura do
arquivo de dados (`dados/catalogo.json`).

Na pasta do projeto:

```bash
npx -y serve -l 4321 .
```

Depois abra http://localhost:4321 no navegador.

---

## Se der erro no `push`

Quase sempre é porque o outro computador mandou algo antes. Resolve com:

```bash
git pull
```

```bash
git push
```

---

## Ver o histórico do que já foi feito

```bash
git log --oneline
```

Cada linha é um ponto de restauração, do mais novo para o mais antigo.
