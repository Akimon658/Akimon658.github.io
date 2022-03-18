declare function loadComment(): void
declare namespace DISQUS {
  function reset(disqusReload: {
    reload: boolean
  }): void
}

export function button() {
  const buttons = document.querySelector<HTMLElement>('.btn')!
  let timeoutId: number
  window.addEventListener('scroll', () => {
    buttons.style.visibility = 'hidden'

    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      buttons.style.visibility = 'visible'
    }, 500)
  })

  document.getElementById('switch-theme')!.addEventListener('click', () => {
    switchTheme()
  })

  const menuButton = document.getElementById('btn-menu')
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      menuOpener()
    })
  }

  document.querySelector('.btn-scroll-top')!.addEventListener('click', () => {
    document.documentElement.scrollTop = 0
  })

  // load comment button only when comment area exist
  if (document.querySelector('span.post-comment-notloaded')) {
    document.querySelector('span.post-comment-notloaded')!.addEventListener('click', loadComment)
  }
}

function getCurrentTheme() {
  const currentTheme = document.body.getAttribute('data-theme')
  if (currentTheme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    return currentTheme === 'dark' ? 'dark' : 'light'
  }
}

function menuOpener() {
  const menu = document.querySelector<HTMLElement>('.sidebar-mobile')
  if (menu) {
    if (menu.style.display === 'none') {
      menu.setAttribute('style', 'display: flex;')
    } else {
      menu.setAttribute('style', 'display: none;')
    }
  }
}

function switchTheme() {
  const currentTheme = getCurrentTheme(),
    domTheme = document.body.getAttribute('data-theme'),
    needAuto = document.body.getAttribute('data-theme-auto') === 'true',
    systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  if (domTheme === 'auto') {
    // if now in auto mode, switch to user mode
    document.body.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light')
    localStorage.setItem('fuji_data-theme', currentTheme === 'light' ? 'dark' : 'light')
  } else {
    let target: string
    if (domTheme === 'light') {
      target = systemTheme === 'dark' ? (needAuto ? 'auto' : 'dark') : 'dark'
    } else {
      target = systemTheme === 'light' ? (needAuto ? 'auto' : 'light') : 'light'
    }
    document.body.setAttribute('data-theme', target)
    document.documentElement.style.colorScheme = target
    localStorage.setItem('fuji_data-theme', target)
  }

  // switch comment area theme
  // if this page has comment area
  const commentArea = document.querySelector('.post-comment')
  if (commentArea) {
    // if comment area loaded
    if (document.querySelector('span.post-comment-notloaded')!.getAttribute('style')) {
      if (commentArea.getAttribute('data-comment') === 'utterances') {
        updateUtterancesTheme(document.querySelector<HTMLIFrameElement>('.post-comment iframe')!)
      }
      if (commentArea.getAttribute('data-comment') === 'disqus') {
        DISQUS.reset({
          reload: true,
        })
      }
    }
  }
}

// update utterances theme
function updateUtterancesTheme(utterancesFrame: HTMLIFrameElement) {
  const targetTheme = getCurrentTheme()
  if (utterancesFrame) {
    if (targetTheme === 'dark') {
      utterancesFrame.contentWindow!.postMessage(
        {
          type: 'set-theme',
          theme: 'photon-dark',
        },
        'https://utteranc.es'
      )
    } else {
      utterancesFrame.contentWindow!.postMessage(
        {
          type: 'set-theme',
          theme: 'github-light',
        },
        'https://utteranc.es'
      )
    }
  }
}
