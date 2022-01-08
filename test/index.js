const { describe, it } = require('mocha');
const equal = require('assert-dir-equal');
const assert = require('assert');
const metalsmith = require('metalsmith');
const layouts = require('@metalsmith/layouts');
const toc = require('..');

function stubfile(contents) {
  return function (files) {
    files['test.html'] = {
      toc: true,
      contents: Buffer.from(
        (
          contents || [
            '<main>',
            '<h1>H1</h1>',
            '<h2>H2</h2>',
            '<h3 id="h3">H3</h3>',
            '</main>',
            '<h4 id="h4">H4</h4>',
            '<h5>H5</h5>',
            '<h6 id="different">H6</h6>'
          ]
        ).join('')
      )
    };
    return files['test.html'].contents.toString();
  };
}

describe('@metalsmith/table-of-contents', function () {
  it('should update h2-h6 by default', function (done) {
    metalsmith(__dirname + '/fixtures/basic')
      .use(stubfile())
      .use(toc())
      .process((err, files) => {
        if (err) return done(err);
        assert.strictEqual(
          files['test.html'].contents.toString(),
          [
            '<main>',
            '<h1>H1</h1>',
            '<h2 id="h2">H2</h2>',
            '<h3 id="h3">H3</h3>',
            '</main>',
            '<h4 id="h4">H4</h4>',
            '<h5 id="h5">H5</h5>',
            '<h6 id="different">H6</h6>'
          ].join('')
        );
        done();
      });
  });

  it('should support the "levels" option', function (done) {
    metalsmith(__dirname + '/fixtures/basic')
      .use(stubfile())
      .use(toc({ levels: [1, 3, 4, 6] }))
      .process((err, files) => {
        if (err) return done(err);
        assert.strictEqual(
          files['test.html'].contents.toString(),
          [
            '<main>',
            '<h1 id="h1">H1</h1>',
            '<h2>H2</h2>',
            '<h3 id="h3">H3</h3>',
            '</main>',
            '<h4 id="h4">H4</h4>',
            '<h5>H5</h5>',
            '<h6 id="different">H6</h6>'
          ].join('')
        );
        done();
      });
  });

  it('should support the "root" option', function (done) {
    metalsmith(__dirname + '/fixtures/basic')
      .use(stubfile())
      .use(toc({ root: 'main' }))
      .process((err, files) => {
        if (err) return done(err);
        assert.strictEqual(
          files['test.html'].contents.toString(),
          [
            '<main>',
            '<h1>H1</h1>',
            '<h2 id="h2">H2</h2>',
            '<h3 id="h3">H3</h3>',
            '</main>',
            '<h4 id="h4">H4</h4>',
            '<h5>H5</h5>',
            '<h6 id="different">H6</h6>'
          ].join('')
        );
        done();
      });
  });

  it('should support the "anchor" option', function (done) {
    try {
      toc({ anchor: 'invalid_value' });
      throw new Error('anchor option should throw on invalid value');
    } catch (err) {
      assert.strictEqual(err.message, "'invalid_value' is not a valid value for 'anchor'");
    }
    new Promise((resolve, reject) => {
      metalsmith(__dirname + '/fixtures/basic')
        .use(stubfile())
        .use(toc({ anchor: 'keep' }))
        .process((err, files) => {
          if (err) return reject(err);
          assert.strictEqual(files['test.html'].contents.toString(), stubfile()({}));
          resolve();
        });
    })
      .then(() => {
        return new Promise((resolve, reject) => {
          metalsmith(__dirname + '/fixtures/basic')
            .use(stubfile())
            .use(toc({ anchor: 'add' }))
            .process((err, files) => {
              if (err) return reject(err);
              assert.strictEqual(
                files['test.html'].contents.toString(),
                [
                  '<main>',
                  '<h1>H1</h1>',
                  '<h2 id="h2">H2</h2>',
                  '<h3 id="h3">H3</h3>',
                  '</main>',
                  '<h4 id="h4">H4</h4>',
                  '<h5 id="h5">H5</h5>',
                  '<h6 id="different">H6</h6>'
                ].join('')
              );
              resolve();
            });
        });
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          metalsmith(__dirname + '/fixtures/basic')
            .use(stubfile(['<h6 id="different-id">H6</h6>']))
            .use(toc({ anchor: 'overwrite' }))
            .process((err, files) => {
              if (err) return reject(err);
              assert.strictEqual(files['test.html'].contents.toString(), '<h6 id="h6">H6</h6>');
              resolve();
            });
        });
      })
      .then(() => done())
      .catch((error) => done(error));
  });

  it('should provide a default rendering of the toc (toc.toString)', function (done) {
    metalsmith(__dirname + '/fixtures/default-rendering')
      .use(toc())
      .use(layouts())
      .build((err) => {
        if (err) done(err);
        equal('test/fixtures/default-rendering/expected', 'test/fixtures/default-rendering/build');
        done();
      });
  });

  it('should be compatible with pregenerated <a name=""></a> tags', function (done) {
    metalsmith(__dirname + '/fixtures/existing-a-anchors')
      .use(
        toc({
          levels: [2, 3],
          anchor($el) {
            const $anchor = $el.prev();
            return $anchor.length ? $anchor.attr('name') : null;
          }
        })
      )
      .use(layouts())
      .build(function (error) {
        if (error) return done(error);
        equal('test/fixtures/existing-a-anchors/expected', 'test/fixtures/existing-a-anchors/build');
        done();
      });
  });
});
