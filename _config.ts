import lume from "lume/mod.ts"
import jsx from "lume/plugins/jsx.ts"
import mdx from "lume/plugins/mdx.ts"
import metas from "lume/plugins/metas.ts"
import multilanguage from "lume/plugins/multilanguage.ts"
import postcss from "lume/plugins/postcss.ts"
import redirects from "lume/plugins/redirects.ts"
import robots from "lume/plugins/robots.ts"
import sitemap from "lume/plugins/sitemap.ts"
import tailwindcss from "lume/plugins/tailwindcss.ts"
import transformImages from "lume/plugins/transform_images.ts"
import escapeHtml from "escape-html"
import type { Token } from "markdown-it"
import mila from "markdown-it-link-attributes"
import rehypeExternalLinks from "rehype-external-links"
import rehypeRaw from "rehype-raw"
import typography from "@tailwindcss/typography"
import Parser from "tree-sitter"
import Bash from "tree-sitter-bash"
import Go from "tree-sitter-go"
import Lua from "@tree-sitter-grammars/tree-sitter-lua"
import Markdown from "@tree-sitter-grammars/tree-sitter-markdown"
import YAML from "@tree-sitter-grammars/tree-sitter-yaml"
import HTML from "tree-sitter-html"
import JavaScript from "tree-sitter-javascript"
import TypeScript from "tree-sitter-typescript"

const site = lume({
  dest: "./public",
  src: "./src",
  location: new URL("https://akimo.dev"),
}, {
  markdown: {
    plugins: [
      [
        mila,
        {
          matcher: (href: string) => href.startsWith("http"),
          attrs: {
            class:
              "after:content-open-in-new after:dark:content-open-in-new-dark",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      ],
    ],
  },
})

const parseCode = (code: string, lang: string) => {
  const languages: Record<string, unknown> = {
    go: Go,
    html: HTML,
    javascript: JavaScript,
    lua: Lua,
    markdown: Markdown,
    shell: Bash,
    ts: TypeScript.typescript,
    yaml: YAML,
  }

  if (!(lang in languages)) {
    return `<pre><code>${escapeHtml(code)}</code></pre>`
  }

  const parser = new Parser()
  parser.setLanguage(languages[lang])

  const tree = parser.parse(code)

  const wrapTag = (node: Parser.SyntaxNode, content?: string): string => {
    let openTag = `<span class="ts-${escapeHtml(node.type)}">`,
      closeTag = "</span>"

    if (node.parent === null) {
      openTag = `<pre><code class="lang-${lang}">`
      closeTag = "</code></pre>"
    }

    return openTag + (content || escapeHtml(node.text)) + closeTag
  }

  const nodeToHtml = (node: Parser.SyntaxNode): string => {
    if (node.childCount === 0) {
      return wrapTag(node)
    }

    let content = ""
    let lastIndex = node.startIndex

    for (const child of node.children) {
      content += escapeHtml(
        node.text.slice(
          lastIndex - node.startIndex,
          child.startIndex - node.startIndex,
        ),
      )
      content += nodeToHtml(child)
      lastIndex = child.endIndex
    }

    content += escapeHtml(node.text.slice(lastIndex))

    return wrapTag(node, content)
  }

  return nodeToHtml(tree.rootNode)
}

site.hooks.addMarkdownItRule("fence", (tokens: Token[], idx: number) => {
  const token = tokens[idx]
  const lang = token.info ? token.info.split(" ")[0] : ""

  return parseCode(token.content, lang)
})

site.copy("icon")

site.use(jsx())

interface MdastNode {
  lang?: string
  value: string
}

site.use(mdx({
  rehypeOptions: {
    allowDangerousHtml: true,
    handlers: {
      code: (_: unknown, node: MdastNode) => {
        return {
          type: "raw",
          value: parseCode(node.value, node.lang ?? ""),
        }
      },
    },
  },
  rehypePlugins: [
    [
      rehypeExternalLinks,
      {
        properties: {
          class:
            "after:content-open-in-new after:dark:content-open-in-new-dark",
        },
        rel: ["noopener", "noreferrer"],
        target: "_blank",
      },
    ],
    [
      rehypeRaw,
      {
        passThrough: ["mdxJsxFlowElement"],
      },
    ],
  ],
}))
site.use(metas())
site.use(redirects())

site.use(tailwindcss({
  options: {
    plugins: [typography],
    theme: {
      fontFamily: {
        sans: ["Atkinson Hyperlegible", "sans-serif"],
        mono: ["monospace"],
      },
      extend: {
        colors: {
          "vsc-back": "#1f1f1f",
          "vsc-front": "#d4d4d4",
        },
        content: {
          "open-in-new": "url('/icon/open_in_new_16dp_2563EB.svg')",
          "open-in-new-dark": "url('/icon/open_in_new_16dp_60A5FA.svg')",
          "open-in-new-gray": "url('/icon/open_in_new_16dp_6B7280.svg')",
        },
        typography: (theme: (s: string) => string) => ({
          DEFAULT: {
            css: {
              "code:not(pre > code)": {
                backgroundColor: theme("colors.gray.100"),
                borderRadius: "0.25rem",
                margin: "0.125rem",
                padding: "0.125rem 0.25rem",
              },
            },
          },
        }),
      },
    },
  },
}))
site.use(postcss())
site.use(robots({
  rules: [
    {
      userAgent: "*",
      disallow: "/external/",
    },
  ],
}))
site.use(transformImages({
  extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
}))

site.use(multilanguage({
  defaultLanguage: "ja",
  languages: ["ja", "en"],
}))
site.use(sitemap({
  query: "externalUrl=undefined",
}))

export default site
