const cheerio = require('cheerio');
const entities = require('entities');
const slugify = require('slugify');
const TocItem = require('./TocItem');

/**
 * @param {TocItem[]} tocItems
 * @returns {TocItem}
 */
function buildTocItems(tocItems) {
  if (tocItems.length === 0) return [];

  const levels = tocItems.map((tocItem) => tocItem.level);

  let lastLevel = Math.min.apply(null, levels) - 1;
  const root = new TocItem('', lastLevel - 1);
  let toc = root;

  tocItems.forEach(function (tocItem) {
    while (tocItem.level != 1 + lastLevel) {
      if (tocItem.level < 1 + lastLevel) {
        toc = toc.parent;
        lastLevel--;
      } else if (tocItem.level > 1 + lastLevel) {
        const bridgeToc = new TocItem('', lastLevel);
        bridgeToc.parent = toc;
        toc.items.push(bridgeToc);
        toc = bridgeToc;
        lastLevel++;
      }
    }
    lastLevel = tocItem.level;
    toc.items.push(tocItem);
    tocItem.parent = toc;
    toc = tocItem;
  });

  return root;
}

/**
 * @callback anchorStrategy
 * @param {import('cheerio').Cheerio} $el
 */

const anchorStrategy = {
  /** @type {anchorStrategy} */
  keep() {
    return false;
  },
  /** @type {anchorStrategy} */
  add($el) {
    if ($el.attr('id')) return $el.attr('id');
    return slugify(entities.decodeHTML($el.text()), { lower: true, strict: true, trim: true });
  },
  /** @type {anchorStrategy} */
  overwrite($el) {
    return slugify(entities.decodeHTML($el.text()), { lower: true, strict: true, trim: true });
  }
};

/**
 * @typedef {Object} Options
 * @prop {String} [levels]
 * @prop {String} [root]
 * @prop {'add'|'keep'|'overwrite'|anchorStrategy} [anchor]
 */

/** @type Options */
const defaultOptions = {
  levels: [2, 3, 4, 5, 6],
  root: null,
  anchor: 'add'
};

/**
 * @param {Options} options
 * @returns {Object}
 */
function normalizeOptions(options) {
  options = Object.assign({}, defaultOptions, options);

  if (typeof options.anchor !== 'function') {
    if (!Object.prototype.hasOwnProperty.call(anchorStrategy, options.anchor)) {
      throw new Error(`'${options.anchor}' is not a valid value for 'anchor'`);
    }
    options.anchor = anchorStrategy[options.anchor];
  }

  options.levels = options.levels
    .map((level) => {
      return `${options.root ? `${options.root} ` : ''} h${level}`;
    })
    .join(',');

  return options;
}

/**
 * Initialize the `@metalsmith/table-of-contents` plugin
 *
 * @param {Options} options
 * @returns {import('metalsmith').Plugin}
 */
module.exports = function initializeTableOfContents(options) {
  const addAnchors = (options || {}).anchor !== 'keep';
  options = normalizeOptions(options);

  return function tableOfContents(files, metalsmith, done) {
    setImmediate(done);

    Object.values(files).forEach((file) => {
      if (!file.toc) return;

      const $ = cheerio.load(file.contents, { decodeEntities: false }, false);
      const $elements = $(options.levels);

      const tocItems = $elements
        .map((i, el) => {
          const $el = $(el);
          const hlevel = parseInt($el.prop('tagName').match(/^h([1-6])$/i)[1]);

          const tocItem = new TocItem(entities.decodeHTML($el.text()), hlevel);
          tocItem.anchor = options.anchor($el) || '';
          // side effect in map!
          if (addAnchors && tocItem.anchor) {
            if (!$(`#${tocItem.anchor}, [name="${tocItem.anchor}"]`).length) {
              $el.attr('id', tocItem.anchor, $);
            }
          }
          return tocItem;
        })
        .toArray();

      file.toc = buildTocItems(tocItems);
      file.contents = Buffer.from($.html());
    });
  };
};
