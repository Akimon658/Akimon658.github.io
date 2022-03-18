---
title: "Generate URL cards when building your Hugo site on GitHub Actions"
date: 2022-03-01T18:15:00+09:00
description: "How to generate URL cards for your Hugo site"
categories: ["dev.to"]
tags: ["Docker", "Golang", "Hugo"]
---

[Hugo](https://gohugo.io) is known as a super-fast static site generator.
It also has many functionaries such as shortcodes.
However, it's not good at dynamic processing because **it can't use remote files other than JSON or CSV**.
So we need an API server to generate link cards from URLs.

Although, it's wasteful to use a rental server and I also want to run it locally.
Therefore, I decided to create a simple Docker image and use it on GitHub Actions.

Here is the repo for the container.

{{< card "https://github.com/Akimon658/ogjson" >}}

## Generate JSON from Open Graph

Just using [otiai10/opengraph](https://github.com/otiai10/opengraph).

```go
package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/otiai10/opengraph"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ogp, err := opengraph.Fetch(r.FormValue("url"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(ogp)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	// Using 0.0.0.0 because cannot access from outside of the container via localhost or 127.0.0.1. Please tell me better solution if you know
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", nil))
}
```

And build it.

```dockerfile
FROM golang:1.17.7-bullseye AS builder

WORKDIR /go/src/ogjson
COPY . .
RUN go install

FROM gcr.io/distroless/base-debian11

COPY --from=builder /go/bin/ogjson /ogjson
CMD ["/ogjson"]
```

Execute `docker run --rm -p 8080:8080 <image>`, then you'll be able to get JSON from `http://localhost:8080/?url=https://example.com`

## Use service containers

> Service containers are Docker containers that provide a simple and portable way for you to host services that you might need to test or operate your application in a workflow. For example, your workflow might need to run integration tests that require access to a database and memory cache.

{{< card "https://docs.github.com/en/actions/using-containerized-services/about-service-containers" >}}

We can use containers by just adding the following settings to the manifest file.

```yaml
jobs:
  # Name of the job
  build:
    runs-on: ubuntu-latest

    services:
      # Name of the service
      ogjson:
        # Name of the image on Docker Hub
        image: akimon658/ogjson:1.0.0
        ports:
          - 8080:8080
```

## Create the shortcode

You must create shortcodes under `layouts/shortcodes/`.
The file name will be the shortcode name.

Here is the shortcode I'm using within this blog.

```html
<!-- Get argument and JSON -->
{{ $url := .Get 0 }}
{{ $json := getJSON "http://localhost:8080/?url=" $url }}

<!-- Add target="_blank" when opening external links -->
<a href="{{ $url | safeURL }}"{{ if strings.HasPrefix $url "http" }} target="_blank" rel="noopener noreferrer"{{ end }}>
  <div class="card">
    <div class="card-meta">
      <div class="card-title" title="{{ $json.Title }}">{{ $json.Title }}</div>
      <div class="card-host">{{ $json.URL.Host }}</div>
      <div class="card-description" title="{{ $json.Description }}">{{ $json.Description }}</div>
    </div>
    <!-- Image is an array so use the first one -->
    {{ range first 1 $json.Image }}
      <img src="{{ .URL }}" alt="{{ .Alt }}">
    {{ end }}
  </div>
</a>
```

I'm using `Title`, `URL.Host`, `Description`, and `Image`, but the JSON gives you more information.

### Call the shortcode

```markdown
{{</* card "https://dev.to" */>}}
```

![Generated card](./dev-card.webp)

Here you can see, Hugo successfully generated a URL card!

I think it is also useful to run on [dev containers](https://code.visualstudio.com/docs/remote/create-dev-container).
