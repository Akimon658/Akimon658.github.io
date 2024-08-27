---
title: "Hugo で Disqus を多言語対応させる"
canonicalURL: ""
date: 2022-01-24T17:20:00+09:00
description: "Hugo のコメント欄をそのページの言語に合わせて変える方法"
tags: ["Hugo", "JavaScript"]
oldUrl: /p/2022/disqus-multi-lang/
---

## 結論

```javascript
window.disqus_config = function() {
	this.language = '{{ .Lang }}';
}
```

## 解説

[Disqus 公式のヘルプ](https://help.disqus.com/en/articles/1717203-multi-lingual-websites)を見ると、

```javascript
var disqus_config = function () {
	this.language = "ja";
};
```

このように言語設定を上書きできるとあります。

なので HTML テンプレートのどこかに

```javascript
var disqus_config = function () {
	this.language = '{{ .Lang }}';
};
```

こう書いておけば基本的には良いんですが、これだと `hugo --minify` した時に変数名 `disqus_config` が短縮されて違う名前になってしまうので意味が無くなります。

しかし、JavaScript におけるグローバル変数は `window` オブジェクトのプロパティとして扱えるので以下のような書き方が可能です。

```javascript
window.disqus_config = function() {
	this.language = '{{ .Lang }}'
}
```

これなら `minify` しても名前が変わってしまうことはありません。

参考：

{{< card "https://developer.mozilla.org/ja/docs/Glossary/Global_object" >}}

## おまけ

Hugo には[公式の Disqus テンプレート](https://github.com/gohugoio/hugo/blob/master/tpl/tplimpl/embedded/templates/disqus.html)がありますが、そこでも `var disqus_config` が使われていたのでプルリクを送ったところマージされました。
ショボいけど初めて OSS に直接コントリビュートできたので嬉しいです。

{{< card "https://github.com/gohugoio/hugo/pull/9550" >}}
