import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import tslint from 'rollup-plugin-tslint';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';

const plugins = [
  tslint(),
  resolve({
    module: true,
    jsnext: true,
    main: true,
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    namedExports: {
    }
  }),
  typescript({useTsconfigDeclarationDir:true}),
  //terser()
];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'es'
      }
    ],
    plugins: plugins,
    external: (id) => {
      if(id.includes('@pixi') || id === 'springroll' || id === 'pixi-animate' || id === 'pixi-sound' || id === 'pixi.js'){
        return true;
      }
      return false;
    }
  }
];
