---
title: 'How to replace home directory with "~" on PowerShell'
date: 2021-12-13T16:42:00+09:00
description: "About how to customize your PowerShell."
draft: false
categories: ["dev.to"]
---

PowerShell displays the current full path by default. It's long, so I'd like to replace it with `~` like Bash.

## Prepare a profile

You can customize your PowerShell with `$profile`.
It doesn't exist by default, so you need to run `touch $profile`.

## Customize

To customize the prompt, use `function prompt`.
Here is a built-in one.

```powershell
function prompt {
    $(if (Test-Path variable:/PSDebugContext) { '[DBG]: ' }
      else { '' }) + 'PS ' + $(Get-Location) +
        $(if ($NestedPromptLevel -ge 1) { '>>' }) + '> '
}
```

Source:

{{< card "https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_prompts?view=powershell-7.2#built-in-prompt" >}}

It seems using `$(Get-Location)` to get the current path, but we can't use it as a `string` (even if we use `$pwd`).
So let's use `Convert-Path` instead.

```powershell
function prompt {
    $currentDir = (Convert-Path .)

    $(if (Test-Path variable:/PSDebugContext) { '[DBG]: ' }
      else { '' }) + 'PS ' + $currentDir +
        $(if ($NestedPromptLevel -ge 1) { '>>' }) + '> '
}
```

Now we can use `$currentDir` as a `string`.
All that is left is checking if it includes `$home` and replacing it.

```powershell
function prompt {
    $currentDir = (Convert-Path .)

    if ($currentDir.Contains($HOME)) {
        $currentDir = $currentDir.Replace($HOME, "~")
    }

    $(if (Test-Path variable:/PSDebugContext) { '[DBG]: ' }
      else { '' }) + 'PS ' + $currentDir +
        $(if ($NestedPromptLevel -ge 1) { '>>' }) + '> '
}
```

## Afterword

This time we made just a little customize for PowerShell, but we can do more things with a profile.
I'm happy if this article will be helpful for you.

Here is my profile for your reference.

{{< card "https://github.com/Akimon658/pwsh-profile" >}}
