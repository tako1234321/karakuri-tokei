// シンプルなモーダルダイアログ

export function showModal(title: string, build: (body: HTMLElement) => void): HTMLElement {
  const root = document.getElementById('modalRoot')!
  root.hidden = false
  root.innerHTML = ''

  const overlay = document.createElement('div')
  overlay.className = 'modalOverlay'
  const box = document.createElement('div')
  box.className = 'modalBox'

  const head = document.createElement('div')
  head.className = 'modalHead'
  const h = document.createElement('div')
  h.className = 'modalTitle'
  h.textContent = title
  const close = document.createElement('button')
  close.className = 'modalClose'
  close.textContent = '✕'
  close.addEventListener('click', closeModal)
  head.append(h, close)

  const body = document.createElement('div')
  body.className = 'modalBody'
  build(body)

  box.append(head, body)
  overlay.appendChild(box)
  overlay.addEventListener('pointerdown', e => {
    if (e.target === overlay) closeModal()
  })
  root.appendChild(overlay)
  return body
}

export function closeModal(): void {
  const root = document.getElementById('modalRoot')!
  root.hidden = true
  root.innerHTML = ''
}

export function button(label: string, onClick: () => void, cls = 'btn'): HTMLButtonElement {
  const b = document.createElement('button')
  b.className = cls
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}
