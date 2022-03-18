---
title: "How to save cookies as a file in Golang"
date: 2022-03-18T21:45:00+09:00
description: "Use juju/persistent-cookiejar to make cookies permanent"
tags: ["Golang"]
---

Go's cookiejar doesn't have any function to persistence cookies, so you need to do [something](https://stackoverflow.com/questions/44031601/how-can-make-a-curl-store-cookie-in-golang) to save cookies to a local file.
To make it easy, you can use [juju/persistent-cookiejar](https://github.com/juju/persistent-cookiejar) instead.

{{< card "https://github.com/juju/persistent-cookiejar" >}}

## Usage

You can use it as same as net/http/cookiejar, and can save cookies by `Save`.

```go
jar, _ := cookiejar.New(nil)
http.DefaultClient.Jar = jar

// Some tasks

jar.Save()
```

Where to save is decided by an option you put into `New`; it is set to `$GOCOOKIES` or `$HOME/.go-cookies` by default.
If the file doesn't exist, it returns no errors and creates it when saving.

```go
jar, _ := cookiejar.New(&cookiejar.Options{Filename: "path/to/cookie"})
```

## Try to use

This is a sample program to log in to [AtCoder](https://atcoder.jp).
It outputs `Already logged in!` if you've already logged in, or asks your username and password if not yet.

{{< details code >}}
Some error handlings were omitted.

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/juju/persistent-cookiejar"
	"golang.org/x/term"
)

func main() {
	jar, _ := cookiejar.New(nil)
	http.DefaultClient.Jar = jar
	defer jar.Save()

	// If the file exists, check whether logged in
	_, err := os.Stat(cookiejar.DefaultCookieFile())
	if err == nil {
		doc, _ := getDocument("https://atcoder.jp/home")
		navbarRight := doc.Find("div#navbar-collapse > ul.navbar-right")
		if navbarRight.Children().Length() == 2 {
			fmt.Println("Already logged in!")
			return
		}
	}

	var username string
	fmt.Print("Username: ")
	fmt.Scan(&username)

	fmt.Print("Password: ")
	// Don't press ctrl+c while Go reads password because your terminal won't display any inputs after that.
	// To resolve it, see gist.github.com/montanaflynn/5ae3eeae7212b0ba232f46e88f1ab67f
	bypePassword, _ := term.ReadPassword(int(os.Stdin.Fd()))

	loginUrl := "https://atcoder.jp/login"
	doc, _ := getDocument(loginUrl)
	token, found := doc.Find(`form input[type="hidden"]`).Attr("value")
	if !found {
		log.Fatal("error: cannot find CSRF token")
	}

	values := url.Values{
		"username":   {username},
		"password":   {string(bypePassword)},
		"csrf_token": {token},
	}
	req, _ := http.NewRequest("POST", loginUrl, strings.NewReader(values.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.Request.URL.String() == loginUrl {
		log.Fatal("Failed to login. Check your username/password")
	}

	fmt.Println("Successfully logged in!")
}

func getDocument(url string) (*goquery.Document, error) {
	resp, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	return goquery.NewDocumentFromReader(resp.Body)
}
```
{{< /details >}}

Now you can find the cookie as a file.

```bash
$ cat ~/.go-cookies
[{"Name":"REVEL_SESSION","Value":"xxxxx...","Domain":"atcoder.jp","Path":"/","Secure":true,"HttpOnly":true,"Persistent":true,"HostOnly":true,"Expires":"2022-09-13T18:19:25.9840269+09:00","Creation":"2022-03-17T18:19:15.4703732+09:00","LastAccess":"2022-03-17T18:19:25.9840269+09:00","Updated":"2022-03-17T18:19:25.9840269+09:00","CanonicalHost":"atcoder.jp"}]
```

If you execute it again when the file exists,

```bash
$ go run main.go
Already logged in!
```

it won't ask you username/password.
