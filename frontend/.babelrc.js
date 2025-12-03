module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  env: {
    test: {
      plugins: [
        // Transform import.meta to a function call that can be mocked
        function() {
          return {
            visitor: {
              MetaProperty(path) {
                if (
                  path.node.meta.name === 'import' &&
                  path.node.property.name === 'meta'
                ) {
                  path.replaceWithSourceString('process');
                }
              }
            }
          };
        }
      ]
    }
  }
};

