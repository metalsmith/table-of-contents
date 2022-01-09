/**
 * @param {string} [text]
 * @param {number} [level]
 */
function TocItem(text, level) {
  this.text = text || ''
  this.level = level || null
  this.items = []
  this.parent = null
  this.anchor = null
}

TocItem.prototype.toString = function () {
  return `<ol class="toc">${this.items
    .map((child) => {
      return `<li class="toc-item">${
        child.anchor ? `<a class="toc-link" href="#${child.anchor}">${child.text}</a>` : ''
      }${child.items.length ? child.toString() : ''}</li>`
    })
    .join('')}</ol>`
}

module.exports = TocItem
